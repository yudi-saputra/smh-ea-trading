// SMH v1.1 — dashboard/controller build
// SATU ARAH: Zero Cross TP + One Side TP
// DUA ARAH: Advanced Partial TP + Per-Side Avg TP
#property copyright "Smart EA Trading v1.1"
#property version   "1.14"
#property strict

#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>

CTrade trade;
CPositionInfo posInfo;

enum ENUM_MARTINGALE_MODE {
   MODE_CONSERVATIVE = 0,
   MODE_AGGRESSIVE   = 1
};

enum ENUM_ENTRY_MODE {
   ENTRY_TWO_WAY = 0,
   ENTRY_ONE_WAY = 1
};

//--- INPUT PARAMETERS ---
input string TerminalId          = "ISI_TERMINAL_ID";
input bool   Use_Auto_Account_ID = true;
input string Manual_Account_ID   = "";
// Licence expiry comes from dashboard via Controller (EA_EXPIRES_{TerminalId})

string GlobalVarName = "";
string Account_ID    = "";
string ExpiresVarName = "";
bool   LicenceExpired = false;
bool   LicenceExpiryHandled = false; // close-once when licence trips

input group "===== GENERAL =====";
input int  InpMagic         = 2025;
input bool Ultra_Fast_Close = true;
input bool Backtest_Mode    = false;

input group "===== TRADING TIME (WIB) =====";
input bool Use_Trading_Time  = true;
input int  Broker_GMT_Offset = 0;
input int  WIB_Start_Hour    = 7;
input int  WIB_Start_Minute  = 0;
input int  WIB_End_Hour      = 17;
input int  WIB_End_Minute    = 0;
// Auto ON dihapus - EA hanya ON via dashboard web (/on) atau tombol chart

input group "===== USER ACTION PROTECTION =====";
input bool Protect_From_Manual_Actions   = true;
input bool Auto_Close_Manual_Positions   = true;
input int  Manual_Position_Check_Seconds = 3;

input group "===== TP DASAR (1 LAYER) - SATU ARAH & DUA ARAH =====";
input double Single_Layer_TP_Points = 20.0;   // TP saat baru 1 posisi di satu sisi

input group "===== SATU ARAH - ZERO CROSS TP =====";
// Hanya Entry_Mode = SATU ARAH. Hold sampai layer >= trigger, lock float=0, lalu TP.
input double ZeroCross_TP_Points     = 100.0;
input int    ZeroCross_Trigger_Layer = 5;

input group "===== SATU ARAH - AUTO RE-ENTRY =====";
// TIDAK berlaku DUA ARAH — sisi kosong diisi Continuous Hedging / entry fresh saat 2 sisi 0.
input bool Auto_Reentry_After_Close = true;
input int  Reentry_Delay_Seconds    = 5;

input group "===== COOLDOWN SETELAH CLOSE ALL =====";
input bool Use_CloseAll_Cooldown     = true;
input int  CloseAll_Cooldown_Seconds = 33;

input group "===== DAILY TARGET & LOSS (Default/Fallback) =====";
// Nilai ini dipakai hanya saat GV belum pernah di-set via dashboard
// Set 0 = disabled
input bool   Use_Daily_Target     = true;
input double Daily_Target_Nominal = 30000.0;
input bool   Stop_On_Daily_Loss   = true;
input double Daily_Loss_Nominal   = 20000.0;
input bool   Auto_Restart_Next_Day = true;

input group "===== RSI TRIGGER =====";
input bool            Use_RSI_Entry  = true;
input int             RSI_Period     = 13;
input ENUM_TIMEFRAMES RSI_Timeframe  = PERIOD_M5;
input double          RSI_Oversold   = 25.0;
input double          RSI_Overbought = 80.0;
input double          RSI_Middle     = 50.0;

input group "===== ENTRY MODE =====";
// TWO_WAY (DUA ARAH) = BUY+SELL sekaligus -> Advanced Partial TP + Per-Side Avg TP
// ONE_WAY (SATU ARAH) = entry RSI -> One Side TP + Zero Cross TP
// Bisa diubah via dashboard: /twoway atau /oneway
input ENUM_ENTRY_MODE Entry_Mode_Default = ENTRY_TWO_WAY;

input group "===== MARTINGALE =====";
input ENUM_MARTINGALE_MODE Martingale_Mode_Default = MODE_CONSERVATIVE;
// Layer Distance bebas input dalam points. Bisa diubah via /setlayer
input double Layer_Distance_Default = 500.0;
input int    LayersPerLotIncrease   = 3;
input double BaseLot                = 0.01;
input double LotIncrement           = 0.01;
// Lot Multiplier untuk AGGRESSIVE mode. Default 1.3. Bisa diubah via /setmultiplier
input double LotMultiplier_Default  = 1.3;
input int    MaxLayers              = 50;
input double MaxLot                 = 10.0;  // 0 = tidak dibatasi

input group "===== CONTINUOUS HEDGING (khusus DUA ARAH) =====";
input bool Enable_Hedging      = true;
input int  Hedging_Start_Layer = 3;
input bool Use_Hedge_Distance  = true;
// Hedge Distance = sama dengan Layer Distance (otomatis ikut /setlayer)

input group "===== DUA ARAH - TP PER SISI (BUY/SELL independen) =====";
// Hanya Entry_Mode = DUA ARAH. BUY/SELL punya TP sendiri, bukan close-all gabungan.
input double Multi_Layer_TP_Points      = 20.0;  // TP dari avg price saat layer > 1
input bool   Use_Advanced_Partial_TP    = true;  // partial close grup lot lama
input int    Partial_TP_Min_Group       = 3;     // grup minimal sebelum partial aktif
input int    Partial_TP_Group_Threshold = 2;     // jarak grup trigger

input group "===== SPREAD FILTER =====";
input bool   Use_Spread_Filter    = true;
input double Max_Spread_Points    = 5.0;
input bool   Block_New_Entry_Only = true;
input bool   Show_Spread_Warning  = false;

input group "===== KOMENTAR POSISI (Trade Comment) =====";
// OFF = komentar kosong. ON = prefix + _L<layer> (muncul di History MT5)
input bool   Use_Custom_Comment   = true;
input string Comment_Buy          = "HEDGE_BUY";    // entry, martingale, continuous hedge
input string Comment_Sell         = "HEDGE_SELL";
input string Comment_Reentry_Buy  = "REENTRY_BUY";
input string Comment_Reentry_Sell = "REENTRY_SELL";

//--- GLOBAL VARIABLES ---
double PipValue        = 0.01;
int    BrokerDigits    = 0;
double PointNormFactor = 1.0;

// FREE LAYER DISTANCE (GV: EA_LAYER_[TerminalId])
double ActiveLayerDistance = 500.0;
double ActiveHedgeDistance = 500.0;
string LayerVarName        = "";

// CUSTOM MULTIPLIER (GV: EA_MULT_[TerminalId])
double ActiveLotMultiplier = 1.3;
string MultVarName         = "";

// ENTRY MODE (GV: EA_ENTRYMODE_[TerminalId])
ENUM_ENTRY_MODE ActiveEntryMode     = ENTRY_TWO_WAY;
string          ActiveEntryModeName = "TWO_WAY";
string          EntryModeVarName    = "";

// MARTINGALE MODE (GV: EA_MODE_[TerminalId])
ENUM_MARTINGALE_MODE ActiveMartingaleMode     = MODE_CONSERVATIVE;
string               ActiveMartingaleModeName = "CONSERVATIVE";
string               ModeVarName              = "";

// PAUSE STATE (GV: EA_PAUSE_[TerminalId])
bool   EA_Paused    = false;
string PauseVarName = "";

// DYNAMIC TARGET & CUTLOSS (GV persist)
double ActiveDailyTarget  = 0.0;  // 0 = disabled
double ActiveDailyCutloss = 0.0;  // 0 = disabled
string TargetVarName      = "";
string CutlossVarName     = "";

// MAX LOT via dashboard (GV: EA_MAXLOT_[TerminalId])
// 0 = tidak dibatasi. Override input MaxLot kalau GV sudah di-set
double ActiveMaxLot   = 0.0;
string MaxLotVarName  = "";

// MAX LAYER via dashboard (GV: EA_MAXLAYER_[TerminalId])
// 0 = tidak dibatasi. Saat total layer (BUY+SELL) >= MaxLayer, entry baru diblokir otomatis
// Resume otomatis saat semua posisi sudah bersih (0 posisi)
int    ActiveMaxLayer    = 0;
bool   MaxLayerBlocked   = false;  // true = sedang terblokir karena max layer
string MaxLayerVarName   = "";

// TRADING HOURS via dashboard (GV: EA_TRADETIME_ / EA_TRADE_START_ / EA_TRADE_END_)
// Start/End disimpan sebagai menit dari midnight WIB
bool   ActiveUseTradingTime = true;
int    ActiveTradeStartMin  = 7*60;   // 07:00
int    ActiveTradeEndMin    = 17*60;  // 17:00
string TradeTimeVarName     = "";
string TradeStartVarName    = "";
string TradeEndVarName      = "";

// Position tracking
int    BUY_LayerCount = 0;
double BUY_TotalVolume = 0;
double BUY_AveragePrice = 0;
double BUY_FirstEntry = 0;
double BUY_LastEntry = 0;
int    BUY_Last_Hedged_Layer = 0;

int    SELL_LayerCount = 0;
double SELL_TotalVolume = 0;
double SELL_AveragePrice = 0;
double SELL_FirstEntry = 0;
double SELL_LastEntry = 0;
int    SELL_Last_Hedged_Layer = 0;

bool BUY_HedgeIsActive  = false;
bool SELL_HedgeIsActive = false;
int  BUY_HedgeCount     = 0;
int  SELL_HedgeCount    = 0;

int  RSI_Handle;
bool EA_Enabled = true;

datetime LastResetDate  = 0;
double   DailyStartBalance = 0;
bool     DailyTargetReached = false;
bool     DailyLossHit = false;

double   CurrentSpread = 0;
bool     SpreadTooHigh = false;
datetime LastSpreadWarning = 0;

datetime LastAutoCloseTime = 0;
bool     WaitingForReentry = false;
int      ReentryDirection  = 0;

datetime LastManualCheckTime = 0;
int      ManualPositionsClosedCount = 0;

double   LastGlobalVarValue = -1;
datetime LastGlobalVarCheck = 0;
datetime LastManualResetTime = 0;

datetime LastCloseAllTime = 0;
bool     InCloseAllCooldown = false;

// Zero Cross TP state
bool   ZeroCross_Triggered = false;
double ZeroCrossPrice      = 0.0;
int    ZeroCross_Direction = 0;
double ZeroCross_TPPrice   = 0.0;

void LogTradeFail(const string what)
{
   Print("[ORDER FAIL] ", what,
         " retcode=", trade.ResultRetcode(),
         " ", trade.ResultRetcodeDescription());
}

bool IsLicenceExpired()
{
   if(!GlobalVariableCheck(ExpiresVarName)) return false;
   double ts=GlobalVariableGet(ExpiresVarName);
   if(ts<=0) return false;
   return TimeGMT() > (datetime)ts;
}

string LicenceExpiryLabel()
{
   if(!GlobalVariableCheck(ExpiresVarName)) return "Exp: sync…";
   double ts=GlobalVariableGet(ExpiresVarName);
   if(ts<=0) return "Exp: none";
   string d=TimeToString((datetime)ts,TIME_DATE);
   if(TimeGMT()>(datetime)ts) return "Exp: "+d+" EXPIRED";
   return "Exp: "+d;
}

void SyncLicenceExpiry()
{
   bool expired=IsLicenceExpired();
   if(expired!=LicenceExpired)
   {
      LicenceExpired=expired;
      if(expired)
      {
         Print("[LICENCE] EXPIRED — trading dihentikan. Hubungi admin.");
         LicenceExpiryHandled=false;
      }
      else
      {
         Print("[LICENCE] Active — ",LicenceExpiryLabel());
         LicenceExpiryHandled=false;
      }
   }
}

void EnforceLicenceExpiry()
{
   if(!LicenceExpired) return;
   // Force OFF via GV so Controller/dashboard see off
   if(GlobalVariableCheck(GlobalVarName) && GlobalVariableGet(GlobalVarName)==1)
      GlobalVariableSet(GlobalVarName,0);
   GlobalVariableSet(PauseVarName,0);
   EA_Paused=false;
   WaitingForReentry=false;
   ReentryDirection=0;
   if(!LicenceExpiryHandled)
   {
      if(BUY_LayerCount>0||SELL_LayerCount>0||PositionsTotal()>0)
         CloseAllPositionsBulk();
      LicenceExpiryHandled=true;
   }
}

void SyncLayerDistance()
{
   if(GlobalVariableCheck(LayerVarName))
   {
      double gv = GlobalVariableGet(LayerVarName);
      if(gv > 0 && gv != ActiveLayerDistance)
      {
         ActiveLayerDistance = gv;
         ActiveHedgeDistance = Use_Hedge_Distance ? ActiveLayerDistance : 0;
         Print("[PARAM] Layer Distance: ", DoubleToString(ActiveLayerDistance,1), " pts");
      }
   }
   else
   {
      GlobalVariableSet(LayerVarName, Layer_Distance_Default);
      ActiveLayerDistance = Layer_Distance_Default;
      ActiveHedgeDistance = Use_Hedge_Distance ? ActiveLayerDistance : 0;
   }
}

void SyncLotMultiplier()
{
   if(GlobalVariableCheck(MultVarName))
   {
      double gv = GlobalVariableGet(MultVarName);
      if(gv > 1.0 && gv != ActiveLotMultiplier)
      {
         ActiveLotMultiplier = gv;
         Print("[PARAM] Lot Multiplier: x", DoubleToString(ActiveLotMultiplier,2));
      }
   }
   else
   {
      GlobalVariableSet(MultVarName, LotMultiplier_Default);
      ActiveLotMultiplier = LotMultiplier_Default;
   }
}

void SyncEntryMode()
{
   if(GlobalVariableCheck(EntryModeVarName))
   {
      int gv = (int)GlobalVariableGet(EntryModeVarName);
      ENUM_ENTRY_MODE nm = (gv == 1) ? ENTRY_ONE_WAY : ENTRY_TWO_WAY;
      if(nm != ActiveEntryMode)
      {
         ActiveEntryMode = nm;
         Print("[PARAM] Entry Mode: ", ActiveEntryMode==ENTRY_ONE_WAY?"SATU ARAH (Zero Cross TP)":"DUA ARAH (Per-Side TP)");
      }
   }
   else
   {
      GlobalVariableSet(EntryModeVarName, (double)Entry_Mode_Default);
      ActiveEntryMode = Entry_Mode_Default;
   }
   ActiveEntryModeName = (ActiveEntryMode == ENTRY_ONE_WAY) ? "SATU ARAH" : "DUA ARAH";
}

void SyncMartingaleMode()
{
   if(GlobalVariableCheck(ModeVarName))
   {
      int gv = (int)GlobalVariableGet(ModeVarName);
      ENUM_MARTINGALE_MODE nm = (gv == 1) ? MODE_AGGRESSIVE : MODE_CONSERVATIVE;
      if(nm != ActiveMartingaleMode)
      {
         ActiveMartingaleMode = nm;
         Print("[PARAM] Martingale Mode: ", ActiveMartingaleMode==MODE_AGGRESSIVE?"AGGRESSIVE":"CONSERVATIVE");
      }
   }
   else
   {
      GlobalVariableSet(ModeVarName, (double)Martingale_Mode_Default);
      ActiveMartingaleMode = Martingale_Mode_Default;
   }
   ActiveMartingaleModeName = (ActiveMartingaleMode == MODE_AGGRESSIVE) ? "AGGRESSIVE" : "CONSERVATIVE";
}

void SyncPauseState()
{
   if(!GlobalVariableCheck(PauseVarName)) { GlobalVariableSet(PauseVarName, 0); EA_Paused = false; return; }
   bool np = (GlobalVariableGet(PauseVarName) == 1);
   if(np != EA_Paused)
   {
      EA_Paused = np;
      Print("[SYNC] Pause: ", EA_Paused ? "PAUSED (entry stop)" : "RESUMED");
   }
}

void SyncDynamicLimits()
{
   if(GlobalVariableCheck(TargetVarName))
   {
      double gv = GlobalVariableGet(TargetVarName);
      if(gv != ActiveDailyTarget)
      { ActiveDailyTarget = gv; Print("[PARAM] Target: ", ActiveDailyTarget<=0?"DISABLED":"$"+DoubleToString(ActiveDailyTarget,2)); }
   }
   else { ActiveDailyTarget = Daily_Target_Nominal; GlobalVariableSet(TargetVarName, ActiveDailyTarget); }

   if(GlobalVariableCheck(CutlossVarName))
   {
      double gv = GlobalVariableGet(CutlossVarName);
      if(gv != ActiveDailyCutloss)
      { ActiveDailyCutloss = gv; Print("[PARAM] Cutloss: ", ActiveDailyCutloss<=0?"DISABLED":"$"+DoubleToString(ActiveDailyCutloss,2)); }
   }
   else { ActiveDailyCutloss = Daily_Loss_Nominal; GlobalVariableSet(CutlossVarName, ActiveDailyCutloss); }
}

void SyncMaxLot()
{
   if(GlobalVariableCheck(MaxLotVarName))
   {
      double gv = GlobalVariableGet(MaxLotVarName);
      if(gv != ActiveMaxLot)
      {
         ActiveMaxLot = gv;
         Print("[PARAM] MaxLot: ", ActiveMaxLot<=0 ? "DISABLED" : DoubleToString(ActiveMaxLot,2));
      }
   }
   else
   {
      ActiveMaxLot = MaxLot;  // fallback ke input param
      GlobalVariableSet(MaxLotVarName, ActiveMaxLot);
   }
}

void SyncMaxLayer()
{
   if(GlobalVariableCheck(MaxLayerVarName))
   {
      int gv = (int)GlobalVariableGet(MaxLayerVarName);
      if(gv != ActiveMaxLayer)
      {
         ActiveMaxLayer = gv;
         Print("[PARAM] MaxLayer: ", ActiveMaxLayer<=0 ? "DISABLED" : IntegerToString(ActiveMaxLayer)+" layer");
         if(ActiveMaxLayer <= 0) MaxLayerBlocked = false;
      }
   }
   else
   {
      ActiveMaxLayer = MaxLayers;  // fallback ke input param
      GlobalVariableSet(MaxLayerVarName, ActiveMaxLayer);
   }
}

void SyncTradingHours()
{
   if(GlobalVariableCheck(TradeTimeVarName))
   {
      bool gv = GlobalVariableGet(TradeTimeVarName)==1;
      if(gv != ActiveUseTradingTime)
      {
         ActiveUseTradingTime = gv;
         Print("[PARAM] Trading Hours: ", ActiveUseTradingTime?"ON":"OFF (24h)");
      }
   }
   else
   {
      ActiveUseTradingTime = Use_Trading_Time;
      GlobalVariableSet(TradeTimeVarName, ActiveUseTradingTime?1:0);
   }

   if(GlobalVariableCheck(TradeStartVarName))
   {
      int gv = (int)GlobalVariableGet(TradeStartVarName);
      if(gv < 0) gv = 0;
      if(gv >= 24*60) gv = gv % (24*60);
      if(gv != ActiveTradeStartMin)
      {
         ActiveTradeStartMin = gv;
         Print("[PARAM] Trade Start: ", StringFormat("%02d:%02d", ActiveTradeStartMin/60, ActiveTradeStartMin%60), " WIB");
      }
   }
   else
   {
      ActiveTradeStartMin = WIB_Start_Hour*60 + WIB_Start_Minute;
      GlobalVariableSet(TradeStartVarName, ActiveTradeStartMin);
   }

   if(GlobalVariableCheck(TradeEndVarName))
   {
      int gv = (int)GlobalVariableGet(TradeEndVarName);
      if(gv < 0) gv = 0;
      if(gv >= 24*60) gv = gv % (24*60);
      if(gv != ActiveTradeEndMin)
      {
         ActiveTradeEndMin = gv;
         Print("[PARAM] Trade End: ", StringFormat("%02d:%02d", ActiveTradeEndMin/60, ActiveTradeEndMin%60), " WIB");
      }
   }
   else
   {
      ActiveTradeEndMin = WIB_End_Hour*60 + WIB_End_Minute;
      GlobalVariableSet(TradeEndVarName, ActiveTradeEndMin);
   }
}

// Cek dan handle MaxLayer block - dipanggil setiap tick setelah update posisi
void CheckMaxLayerBlock()
{
   if(ActiveMaxLayer <= 0) { MaxLayerBlocked = false; return; }
   int totalLayers = BUY_LayerCount + SELL_LayerCount;

   if(!MaxLayerBlocked && totalLayers >= ActiveMaxLayer)
   {
      MaxLayerBlocked = true;
      Print("========================================");
      Print("[MAXLAYER] Batas layer tercapai! Total:", totalLayers, " / Max:", ActiveMaxLayer);
      Print("[MAXLAYER] Entry baru DIBLOKIR - tunggu posisi selesai");
      Print("========================================");
   }
   else if(MaxLayerBlocked && totalLayers == 0)
   {
      MaxLayerBlocked = false;
      Print("========================================");
      Print("[MAXLAYER] Semua posisi bersih - MaxLayer block DILEPAS, EA siap entry baru");
      Print("========================================");
   }
}
double ConvertPointsToPrice(double points) { return points * PointNormFactor; }

string BuildComment(const string prefix, const int layer=1)
{
   if(!Use_Custom_Comment) return "";
   return prefix + "_L" + IntegerToString(layer);
}

bool CheckSpread()
{
   if(!Use_Spread_Filter) return true;
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   CurrentSpread = (ask - bid) / _Point;
   if(CurrentSpread > Max_Spread_Points)
   {
      SpreadTooHigh = true;
      if(Show_Spread_Warning && TimeCurrent()-LastSpreadWarning > 60)
      { Print("Spread too high: ",DoubleToString(CurrentSpread,1)," Max:",DoubleToString(Max_Spread_Points,1)); LastSpreadWarning=TimeCurrent(); }
      return false;
   }
   SpreadTooHigh = false; return true;
}

double CalculateLotForLayer(int layerNumber)
{
   double lots = 0;
   if(ActiveMartingaleMode == MODE_CONSERVATIVE)
   {
      int grp = (int)((layerNumber - 1) / LayersPerLotIncrease);
      lots = BaseLot + (grp * LotIncrement);
   }
   else
      lots = BaseLot * MathPow(ActiveLotMultiplier, layerNumber - 1);

   double minL=SymbolInfoDouble(_Symbol,SYMBOL_VOLUME_MIN), maxL=SymbolInfoDouble(_Symbol,SYMBOL_VOLUME_MAX), stepL=SymbolInfoDouble(_Symbol,SYMBOL_VOLUME_STEP);
   lots = MathFloor(lots/stepL)*stepL;
   if(lots < minL) lots = minL;
   if(ActiveMaxLot > 0 && lots > ActiveMaxLot) lots = ActiveMaxLot;
   if(lots > maxL) lots = maxL;
   return lots;
}

int GetLotGroup(int layerNumber) { return (int)MathCeil((double)layerNumber / LayersPerLotIncrease); }

bool IsInCloseAllCooldown()
{
   if(!Use_CloseAll_Cooldown) return false;
   if(LastCloseAllTime == 0) return false;
   int el = (int)(TimeCurrent() - LastCloseAllTime);
   if(el < CloseAll_Cooldown_Seconds) { InCloseAllCooldown = true; return true; }
   if(InCloseAllCooldown) { Print("[OK] Cooldown selesai"); InCloseAllCooldown = false; }
   return false;
}

void SetReentryDirectionBoth() { ReentryDirection = 0; }

void ResetZeroCrossState() { ZeroCross_Triggered=false; ZeroCrossPrice=0.0; ZeroCross_Direction=0; ZeroCross_TPPrice=0.0; }

void ResetHedgeTrackers()
{
   BUY_Last_Hedged_Layer=0; SELL_Last_Hedged_Layer=0;
   BUY_HedgeIsActive=false; SELL_HedgeIsActive=false;
   BUY_HedgeCount=0; SELL_HedgeCount=0;
}

// ONE SIDE TP (khusus SATU ARAH)
void CheckOneSideTP()
{
   if(ActiveEntryMode == ENTRY_TWO_WAY) return;

   bool useZC = (BUY_LayerCount >= ZeroCross_Trigger_Layer || SELL_LayerCount >= ZeroCross_Trigger_Layer);
   if(useZC) return;

   datetime nBT=0, nST=0;
   for(int i=PositionsTotal()-1;i>=0;i--)
   {
      if(posInfo.SelectByIndex(i) && posInfo.Symbol()==_Symbol && posInfo.Magic()==InpMagic)
      {
         if(posInfo.PositionType()==POSITION_TYPE_BUY  && (datetime)posInfo.Time()>nBT) nBT=(datetime)posInfo.Time();
         if(posInfo.PositionType()==POSITION_TYPE_SELL && (datetime)posInfo.Time()>nST) nST=(datetime)posInfo.Time();
      }
   }
   int minH=3;
   double bid=SymbolInfoDouble(_Symbol,SYMBOL_BID), ask=SymbolInfoDouble(_Symbol,SYMBOL_ASK);
   double tpD=ConvertPointsToPrice(Single_Layer_TP_Points);

   if(BUY_LayerCount>0 && TimeCurrent()-nBT>=minH)
   {
      double tpP = BUY_AveragePrice + tpD;
      if(bid >= tpP)
      {
         Print("[OneSideTP] BUY TP | L",BUY_LayerCount," avg:",DoubleToString(BUY_AveragePrice,_Digits)," TP@",DoubleToString(tpP,_Digits));
         CloseAllBuyPositions();
         ResetZeroCrossState();
         WaitingForReentry = false;
         ReentryDirection  = 0;

         if(Auto_Reentry_After_Close && !EA_Paused)
         {
            ReentryDirection = 2;
            WaitingForReentry = true;
            LastAutoCloseTime = TimeCurrent();
            Print("[SATU ARAH] TP hit - tunggu RSI signal baru untuk re-entry");
         }
         else if(EA_Paused)
         {
            Print("[PAUSE] BUY TP hit - posisi di-close, re-entry DIBLOKIR. ON dari dashboard untuk mulai lagi.");
         }
         return;
      }
   }
   if(SELL_LayerCount>0 && TimeCurrent()-nST>=minH)
   {
      double tpP = SELL_AveragePrice - tpD;
      if(ask <= tpP)
      {
         Print("[OneSideTP] SELL TP | L",SELL_LayerCount," avg:",DoubleToString(SELL_AveragePrice,_Digits)," TP@",DoubleToString(tpP,_Digits));
         CloseAllSellPositions();
         ResetZeroCrossState();
         WaitingForReentry = false;
         ReentryDirection  = 0;

         if(Auto_Reentry_After_Close && !EA_Paused)
         {
            ReentryDirection = 2;
            WaitingForReentry = true;
            LastAutoCloseTime = TimeCurrent();
            Print("[SATU ARAH] TP hit - tunggu RSI signal baru untuk re-entry");
         }
         else if(EA_Paused)
         {
            Print("[PAUSE] SELL TP hit - posisi di-close, re-entry DIBLOKIR. ON dari dashboard untuk mulai lagi.");
         }
      }
   }
}

// ZERO CROSS TP (khusus SATU ARAH)
void CheckZeroCrossTP()
{
   if(ActiveEntryMode == ENTRY_TWO_WAY) { ResetZeroCrossState(); return; }

   if(BUY_LayerCount==0 && SELL_LayerCount==0) { ResetZeroCrossState(); return; }
   bool useZC = (BUY_LayerCount >= ZeroCross_Trigger_Layer || SELL_LayerCount >= ZeroCross_Trigger_Layer);
   if(!useZC)
   {
      ResetZeroCrossState();
      return;
   }

   double totalF = CalculateBuySideProfit() + CalculateSellSideProfit();
   double cBid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double cAsk = SymbolInfoDouble(_Symbol, SYMBOL_ASK);

   if(totalF < 0.0) { if(ZeroCross_Triggered) { Print("[ZeroTP] Float negatif -> RESET"); ResetZeroCrossState(); } return; }

   if(!ZeroCross_Triggered)
   {
      ZeroCross_Direction = (BUY_LayerCount >= SELL_LayerCount) ? 1 : -1;
      ZeroCrossPrice    = (ZeroCross_Direction == 1) ? cBid : cAsk;
      double tpD        = ConvertPointsToPrice(ZeroCross_TP_Points);
      ZeroCross_TPPrice = (ZeroCross_Direction == 1) ? ZeroCrossPrice + tpD : ZeroCrossPrice - tpD;
      ZeroCross_Triggered = true;
      Print("========================================");
      Print("[ZeroTP] ZERO CROSS LOCK | Float:$",DoubleToString(totalF,2)," Arah:",ZeroCross_Direction==1?"BUY":"SELL");
      Print("   Zero @ ",DoubleToString(ZeroCrossPrice,_Digits)," | TP @ ",DoubleToString(ZeroCross_TPPrice,_Digits));
      Print("========================================");
   }

   bool hit = (ZeroCross_Direction==1) ? (cBid >= ZeroCross_TPPrice) : (cAsk <= ZeroCross_TPPrice);
   if(hit)
   {
      Print("[ZeroTP] TP HIT! Float:$",DoubleToString(totalF,2));

      CloseAllBuyPositions(); Sleep(100); CloseAllSellPositions();
      ResetHedgeTrackers();
      LastCloseAllTime  = TimeCurrent();
      InCloseAllCooldown = true;
      ResetZeroCrossState();

      WaitingForReentry = false;
      ReentryDirection  = 0;

      if(Auto_Reentry_After_Close && !EA_Paused)
      {
         ReentryDirection  = 2;
         WaitingForReentry = true;
         LastAutoCloseTime = TimeCurrent();
         Print("[SATU ARAH] ZeroTP - tunggu RSI signal baru");
      }
      else if(EA_Paused)
      {
         Print("[PAUSE] ZeroCross TP hit - semua posisi di-close, re-entry DIBLOKIR. ON dari dashboard untuk mulai lagi.");
      }
   }
}

// ADVANCED PARTIAL TP - BUY (khusus DUA ARAH)
void CheckAdvancedBuyPartialTP()
{
   if(ActiveEntryMode != ENTRY_TWO_WAY) return;
   if(!Use_Advanced_Partial_TP) return;
   if(BUY_LayerCount == 0) return;

   double currentBid = SymbolInfoDouble(_Symbol, SYMBOL_BID);

   struct BuyPosInfo
   {
      ulong  ticket;
      double openPrice;
      double volume;
      int    lotGroup;
   };

   BuyPosInfo positions[];
   int posCount = 0;

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(posInfo.SelectByIndex(i))
      {
         if(posInfo.Symbol() == _Symbol &&
            posInfo.Magic() == InpMagic &&
            posInfo.PositionType() == POSITION_TYPE_BUY)
         {
            ArrayResize(positions, posCount + 1);
            positions[posCount].ticket    = posInfo.Ticket();
            positions[posCount].openPrice = posInfo.PriceOpen();
            positions[posCount].volume    = posInfo.Volume();

            double vol = posInfo.Volume();
            int grp = 1;
            if(ActiveMartingaleMode == MODE_CONSERVATIVE)
            {
               grp = (int)MathRound((vol - BaseLot) / LotIncrement) + 1;
               if(grp < 1) grp = 1;
            }
            else
            {
               grp = 1;
               double testLot = BaseLot;
               for(int g = 1; g <= 50; g++)
               {
                  if(MathAbs(testLot - vol) < 0.001)
                  {
                     grp = GetLotGroup(g);
                     break;
                  }
                  testLot = BaseLot * MathPow(ActiveLotMultiplier, g);
               }
            }
            positions[posCount].lotGroup = grp;
            posCount++;
         }
      }
   }

   if(posCount == 0) return;

   double lowestPrice = positions[0].openPrice;
   int    lowestGroup = positions[0].lotGroup;

   for(int i = 1; i < posCount; i++)
   {
      if(positions[i].openPrice < lowestPrice)
      {
         lowestPrice = positions[i].openPrice;
         lowestGroup = positions[i].lotGroup;
      }
   }

   if(lowestGroup < Partial_TP_Min_Group) return;

   int triggerGroup = lowestGroup - Partial_TP_Group_Threshold;
   if(triggerGroup < 1) return;

   double triggerPrice = 0;

   for(int i = 0; i < posCount; i++)
   {
      if(positions[i].lotGroup == triggerGroup)
      {
         if(triggerPrice == 0 || positions[i].openPrice < triggerPrice)
            triggerPrice = positions[i].openPrice;
      }
   }

   if(triggerPrice == 0)
   {
      for(int g = triggerGroup; g < lowestGroup; g++)
      {
         for(int i = 0; i < posCount; i++)
         {
            if(positions[i].lotGroup == g)
            {
               if(triggerPrice == 0 || positions[i].openPrice < triggerPrice)
                  triggerPrice = positions[i].openPrice;
            }
         }
         if(triggerPrice > 0) break;
      }
   }

   if(triggerPrice == 0) return;
   if(currentBid < triggerPrice) return;

   ulong closeTickets[];
   int closeCount = 0;
   double closeLotSum = 0;
   int closeGroupMin = triggerGroup + 1;

   for(int i = 0; i < posCount; i++)
   {
      if(positions[i].lotGroup >= closeGroupMin)
      {
         ArrayResize(closeTickets, closeCount + 1);
         closeTickets[closeCount] = positions[i].ticket;
         closeLotSum += positions[i].volume;
         closeCount++;
      }
   }

   if(closeCount == 0) return;

   Print("========================================");
   Print("[BUY] ADVANCED PARTIAL TP BUY TRIGGERED!");
   Print("   Posisi terendah grup  : ", lowestGroup);
   Print("   Trigger grup          : ", triggerGroup);
   Print("   Trigger price         : ", DoubleToString(triggerPrice, _Digits));
   Print("   Harga sekarang (Bid)  : ", DoubleToString(currentBid, _Digits));
   Print("   Jumlah posisi di-TP   : ", closeCount);
   Print("   Total lot di-TP       : ", DoubleToString(closeLotSum, 2));
   Print("========================================");

   if(Ultra_Fast_Close)
   {
      trade.SetAsyncMode(true);
      for(int i = 0; i < closeCount; i++)
         trade.PositionClose(closeTickets[i]);
      trade.SetAsyncMode(false);
   }
   else
   {
      for(int i = 0; i < closeCount; i++)
         trade.PositionClose(closeTickets[i]);
   }

   BUY_Last_Hedged_Layer = 0;
   Print("[OK] BUY Partial TP selesai - ", closeCount, " posisi ditutup");
}

// ADVANCED PARTIAL TP - SELL (khusus DUA ARAH)
void CheckAdvancedSellPartialTP()
{
   if(ActiveEntryMode != ENTRY_TWO_WAY) return;
   if(!Use_Advanced_Partial_TP) return;
   if(SELL_LayerCount == 0) return;

   double currentAsk = SymbolInfoDouble(_Symbol, SYMBOL_ASK);

   struct SellPosInfo
   {
      ulong  ticket;
      double openPrice;
      double volume;
      int    lotGroup;
   };

   SellPosInfo positions[];
   int posCount = 0;

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(posInfo.SelectByIndex(i))
      {
         if(posInfo.Symbol() == _Symbol &&
            posInfo.Magic() == InpMagic &&
            posInfo.PositionType() == POSITION_TYPE_SELL)
         {
            ArrayResize(positions, posCount + 1);
            positions[posCount].ticket    = posInfo.Ticket();
            positions[posCount].openPrice = posInfo.PriceOpen();
            positions[posCount].volume    = posInfo.Volume();

            double vol = posInfo.Volume();
            int grp = 1;
            if(ActiveMartingaleMode == MODE_CONSERVATIVE)
            {
               grp = (int)MathRound((vol - BaseLot) / LotIncrement) + 1;
               if(grp < 1) grp = 1;
            }
            else
            {
               grp = 1;
               double testLot = BaseLot;
               for(int g = 1; g <= 50; g++)
               {
                  if(MathAbs(testLot - vol) < 0.001)
                  {
                     grp = GetLotGroup(g);
                     break;
                  }
                  testLot = BaseLot * MathPow(ActiveLotMultiplier, g);
               }
            }
            positions[posCount].lotGroup = grp;
            posCount++;
         }
      }
   }

   if(posCount == 0) return;

   double highestPrice = positions[0].openPrice;
   int    highestGroup = positions[0].lotGroup;

   for(int i = 1; i < posCount; i++)
   {
      if(positions[i].openPrice > highestPrice)
      {
         highestPrice = positions[i].openPrice;
         highestGroup = positions[i].lotGroup;
      }
   }

   if(highestGroup < Partial_TP_Min_Group) return;

   int triggerGroup = highestGroup - Partial_TP_Group_Threshold;
   if(triggerGroup < 1) return;

   double triggerPrice = 0;

   for(int i = 0; i < posCount; i++)
   {
      if(positions[i].lotGroup == triggerGroup)
      {
         if(triggerPrice == 0 || positions[i].openPrice > triggerPrice)
            triggerPrice = positions[i].openPrice;
      }
   }

   if(triggerPrice == 0)
   {
      for(int g = triggerGroup; g < highestGroup; g++)
      {
         for(int i = 0; i < posCount; i++)
         {
            if(positions[i].lotGroup == g)
            {
               if(triggerPrice == 0 || positions[i].openPrice > triggerPrice)
                  triggerPrice = positions[i].openPrice;
            }
         }
         if(triggerPrice > 0) break;
      }
   }

   if(triggerPrice == 0) return;
   if(currentAsk > triggerPrice) return;

   ulong closeTickets[];
   int closeCount = 0;
   double closeLotSum = 0;
   int closeGroupMin = triggerGroup + 1;

   for(int i = 0; i < posCount; i++)
   {
      if(positions[i].lotGroup >= closeGroupMin)
      {
         ArrayResize(closeTickets, closeCount + 1);
         closeTickets[closeCount] = positions[i].ticket;
         closeLotSum += positions[i].volume;
         closeCount++;
      }
   }

   if(closeCount == 0) return;

   Print("========================================");
   Print("[SELL] ADVANCED PARTIAL TP SELL TRIGGERED!");
   Print("   Posisi tertinggi grup : ", highestGroup);
   Print("   Trigger grup          : ", triggerGroup);
   Print("   Trigger price         : ", DoubleToString(triggerPrice, _Digits));
   Print("   Harga sekarang (Ask)  : ", DoubleToString(currentAsk, _Digits));
   Print("   Jumlah posisi di-TP   : ", closeCount);
   Print("   Total lot di-TP       : ", DoubleToString(closeLotSum, 2));
   Print("========================================");

   if(Ultra_Fast_Close)
   {
      trade.SetAsyncMode(true);
      for(int i = 0; i < closeCount; i++)
         trade.PositionClose(closeTickets[i]);
      trade.SetAsyncMode(false);
   }
   else
   {
      for(int i = 0; i < closeCount; i++)
         trade.PositionClose(closeTickets[i]);
   }

   SELL_Last_Hedged_Layer = 0;
   Print("[OK] SELL Partial TP selesai - ", closeCount, " posisi ditutup");
}

// PER-SIDE AVG PRICE TP (khusus DUA ARAH)
void CheckBuyTP_TwoWay()
{
   if(ActiveEntryMode != ENTRY_TWO_WAY) return;
   if(BUY_LayerCount == 0) return;
   if(!Block_New_Entry_Only && !CheckSpread()) return;

   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double tpPrice = (BUY_LayerCount == 1) ?
      BUY_FirstEntry + ConvertPointsToPrice(Single_Layer_TP_Points) :
      BUY_AveragePrice + ConvertPointsToPrice(Multi_Layer_TP_Points);

   if(bid >= tpPrice)
   {
      Print("[TWO_WAY TP] BUY side TP hit | L",BUY_LayerCount," avg:",DoubleToString(BUY_AveragePrice,_Digits)," TP@",DoubleToString(tpPrice,_Digits));
      CloseAllBuyPositions();
   }
}

void CheckSellTP_TwoWay()
{
   if(ActiveEntryMode != ENTRY_TWO_WAY) return;
   if(SELL_LayerCount == 0) return;
   if(!Block_New_Entry_Only && !CheckSpread()) return;

   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double tpPrice = (SELL_LayerCount == 1) ?
      SELL_FirstEntry - ConvertPointsToPrice(Single_Layer_TP_Points) :
      SELL_AveragePrice - ConvertPointsToPrice(Multi_Layer_TP_Points);

   if(ask <= tpPrice)
   {
      Print("[TWO_WAY TP] SELL side TP hit | L",SELL_LayerCount," avg:",DoubleToString(SELL_AveragePrice,_Digits)," TP@",DoubleToString(tpPrice,_Digits));
      CloseAllSellPositions();
   }
}

void CheckReentry()
{
   if(!WaitingForReentry) return;
   if(TimeCurrent()-LastAutoCloseTime < Reentry_Delay_Seconds) return;
   if(EA_Paused) return;
   bool noPos = (BUY_LayerCount==0 && SELL_LayerCount==0);
   if(noPos && IsInCloseAllCooldown()) return;
   if(!CheckSpread()) return;

   // Direction 0 = BUY+SELL sekaligus (legacy / manual)
   if(ReentryDirection == 0)
   {
      if(!noPos) { WaitingForReentry=false; return; }
      bool bOK = trade.Buy(BaseLot, _Symbol, 0, 0, 0, BuildComment(Comment_Reentry_Buy)); Sleep(50);
      bool sOK = trade.Sell(BaseLot, _Symbol, 0, 0, 0, BuildComment(Comment_Reentry_Sell));
      if(bOK || sOK) { Print("[REENTRY DUA ARAH] BUY:",bOK?"OK":"FAIL"," SELL:",sOK?"OK":"FAIL"); WaitingForReentry=false; }
      else { LogTradeFail("REENTRY BUY"); LogTradeFail("REENTRY SELL"); }
      return;
   }
   // Direction 1 = re-entry BUY saja
   if(ReentryDirection == 1)
   {
      if(BUY_LayerCount>0) { WaitingForReentry=false; ReentryDirection=0; return; }
      if(trade.Buy(BaseLot,_Symbol,0,0,0,BuildComment(Comment_Reentry_Buy))) { Print("[REENTRY] BUY"); WaitingForReentry=false; ReentryDirection=0; }
      else LogTradeFail("REENTRY BUY");
      return;
   }
   // Direction -1 = re-entry SELL saja
   if(ReentryDirection == -1)
   {
      if(SELL_LayerCount>0) { WaitingForReentry=false; ReentryDirection=0; return; }
      if(trade.Sell(BaseLot,_Symbol,0,0,0,BuildComment(Comment_Reentry_Sell))) { Print("[REENTRY] SELL"); WaitingForReentry=false; ReentryDirection=0; }
      else LogTradeFail("REENTRY SELL");
      return;
   }
   // Direction 2 = ONE_WAY: tunggu RSI signal baru
   if(ReentryDirection == 2)
   {
      if(!noPos) { WaitingForReentry=false; ReentryDirection=0; return; }
      int sig = GetRSISignal();
      if(sig == 1)
      {
         if(trade.Buy(BaseLot,_Symbol,0,0,0,BuildComment(Comment_Reentry_Buy)))
         { Print("[REENTRY SATU ARAH] BUY berdasarkan RSI signal"); WaitingForReentry=false; ReentryDirection=0; }
         else LogTradeFail("REENTRY ONE_WAY BUY");
      }
      else if(sig == -1)
      {
         if(trade.Sell(BaseLot,_Symbol,0,0,0,BuildComment(Comment_Reentry_Sell)))
         { Print("[REENTRY SATU ARAH] SELL berdasarkan RSI signal"); WaitingForReentry=false; ReentryDirection=0; }
         else LogTradeFail("REENTRY ONE_WAY SELL");
      }
      return;
   }
}

void ResetTargetManual()
{
   Print("========================================");
   Print("[RESET] MANUAL RESET");
   DailyStartBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   LastManualResetTime = TimeCurrent();
   DailyTargetReached = false; DailyLossHit = false;
   EA_Enabled = true; ManualPositionsClosedCount = 0;
   LastCloseAllTime = 0; InCloseAllCooldown = false;
   EA_Paused = false; GlobalVariableSet(PauseVarName, 0);
   ResetHedgeTrackers(); ResetZeroCrossState();
   GlobalVariableSet("EA_DAILY_TARGET_"+TerminalId, 0);
   GlobalVariableSet("EA_DAILY_LOSS_"+TerminalId, 0);
   Print("   Balance  : $",DoubleToString(DailyStartBalance,2));
   Print("   Target   : ",ActiveDailyTarget<=0?"DISABLED":"$"+DoubleToString(ActiveDailyTarget,2));
   Print("   Cutloss  : ",ActiveDailyCutloss<=0?"DISABLED":"$"+DoubleToString(ActiveDailyCutloss,2));
   Print("   Layer    : ",DoubleToString(ActiveLayerDistance,1)," pts");
   Print("   Mult     : x",DoubleToString(ActiveLotMultiplier,2));
   Print("   Mode     : ",ActiveMartingaleModeName," | Entry: ",ActiveEntryModeName);
   Print("========================================");
}

void UpdateBuySideData()
{
   BUY_LayerCount=0; BUY_TotalVolume=0; double sv=0; BUY_FirstEntry=0; BUY_LastEntry=0;
   for(int i=PositionsTotal()-1;i>=0;i--)
      if(posInfo.SelectByIndex(i) && posInfo.Symbol()==_Symbol && posInfo.Magic()==InpMagic && posInfo.PositionType()==POSITION_TYPE_BUY)
      {
         double v=posInfo.Volume(),p=posInfo.PriceOpen();
         BUY_TotalVolume+=v; sv+=p*v; BUY_LayerCount++;
         if(BUY_FirstEntry==0||p>BUY_FirstEntry) BUY_FirstEntry=p;
         if(BUY_LastEntry==0||p<BUY_LastEntry)   BUY_LastEntry=p;
      }
   if(BUY_TotalVolume>0) BUY_AveragePrice=sv/BUY_TotalVolume;
   else { BUY_AveragePrice=0; BUY_Last_Hedged_Layer=0; SELL_HedgeIsActive=false; }
}

void UpdateSellSideData()
{
   SELL_LayerCount=0; SELL_TotalVolume=0; double sv=0; SELL_FirstEntry=0; SELL_LastEntry=0;
   for(int i=PositionsTotal()-1;i>=0;i--)
      if(posInfo.SelectByIndex(i) && posInfo.Symbol()==_Symbol && posInfo.Magic()==InpMagic && posInfo.PositionType()==POSITION_TYPE_SELL)
      {
         double v=posInfo.Volume(),p=posInfo.PriceOpen();
         SELL_TotalVolume+=v; sv+=p*v; SELL_LayerCount++;
         if(SELL_FirstEntry==0||p<SELL_FirstEntry) SELL_FirstEntry=p;
         if(SELL_LastEntry==0||p>SELL_LastEntry)   SELL_LastEntry=p;
      }
   if(SELL_TotalVolume>0) SELL_AveragePrice=sv/SELL_TotalVolume;
   else { SELL_AveragePrice=0; SELL_Last_Hedged_Layer=0; BUY_HedgeIsActive=false; }
}

double CalculateBuySideProfit()
{
   double p=0;
   for(int i=PositionsTotal()-1;i>=0;i--)
      if(posInfo.SelectByIndex(i) && posInfo.Symbol()==_Symbol && posInfo.Magic()==InpMagic && posInfo.PositionType()==POSITION_TYPE_BUY)
         p+=posInfo.Profit()+posInfo.Commission()+posInfo.Swap();
   return p;
}

double CalculateSellSideProfit()
{
   double p=0;
   for(int i=PositionsTotal()-1;i>=0;i--)
      if(posInfo.SelectByIndex(i) && posInfo.Symbol()==_Symbol && posInfo.Magic()==InpMagic && posInfo.PositionType()==POSITION_TYPE_SELL)
         p+=posInfo.Profit()+posInfo.Commission()+posInfo.Swap();
   return p;
}

void CloseAllBuyPositions()
{
   ulong t[]; int c=0;
   for(int i=PositionsTotal()-1;i>=0;i--)
      if(posInfo.SelectByIndex(i) && posInfo.Symbol()==_Symbol && posInfo.Magic()==InpMagic && posInfo.PositionType()==POSITION_TYPE_BUY)
      { ArrayResize(t,c+1); t[c]=posInfo.Ticket(); c++; }
   if(!c) return;
   if(Ultra_Fast_Close) { trade.SetAsyncMode(true); for(int i=0;i<c;i++) trade.PositionClose(t[i]); trade.SetAsyncMode(false); }
   else for(int i=0;i<c;i++) trade.PositionClose(t[i]);
   BUY_Last_Hedged_Layer=0; SELL_HedgeIsActive=false;
}

void CloseAllSellPositions()
{
   ulong t[]; int c=0;
   for(int i=PositionsTotal()-1;i>=0;i--)
      if(posInfo.SelectByIndex(i) && posInfo.Symbol()==_Symbol && posInfo.Magic()==InpMagic && posInfo.PositionType()==POSITION_TYPE_SELL)
      { ArrayResize(t,c+1); t[c]=posInfo.Ticket(); c++; }
   if(!c) return;
   if(Ultra_Fast_Close) { trade.SetAsyncMode(true); for(int i=0;i<c;i++) trade.PositionClose(t[i]); trade.SetAsyncMode(false); }
   else for(int i=0;i<c;i++) trade.PositionClose(t[i]);
   SELL_Last_Hedged_Layer=0; BUY_HedgeIsActive=false;
}

void CloseAllPositionsBulk()
{
   Print("BULK CLOSE ALL");
   ulong aT[]; int tot=0;
   for(int i=PositionsTotal()-1;i>=0;i--)
      if(posInfo.SelectByIndex(i) && posInfo.Symbol()==_Symbol && posInfo.Magic()==InpMagic)
      { ArrayResize(aT,tot+1); aT[tot]=posInfo.Ticket(); tot++; }
   if(!tot) return;
   trade.SetAsyncMode(true); for(int i=0;i<tot;i++) trade.PositionClose(aT[i]); trade.SetAsyncMode(false); Sleep(500);
   for(int att=0;att<2;att++)
      for(int i=PositionsTotal()-1;i>=0;i--)
         if(posInfo.SelectByIndex(i) && posInfo.Symbol()==_Symbol && posInfo.Magic()==InpMagic)
         { trade.PositionClose(posInfo.Ticket()); Sleep(50); }
   ResetHedgeTrackers(); ResetZeroCrossState();
   Print("BULK CLOSE COMPLETED");
}

double GetDailyPnL()
{
   int tz=Broker_GMT_Offset-7, rh=5+tz;
   if(rh<0)rh+=24; if(rh>=24)rh-=24;
   MqlDateTime now; TimeToStruct(TimeCurrent(),now);
   MqlDateTime rt; rt.year=now.year;rt.mon=now.mon;rt.day=now.day;rt.hour=rh;rt.min=0;rt.sec=0;
   datetime tdr=StructToTime(rt);
   if(TimeCurrent()<tdr) tdr-=86400;
   datetime st=(LastManualResetTime>tdr)?LastManualResetTime:tdr;
   double cl=0;
   if(HistorySelect(st,TimeCurrent()))
      for(int i=0;i<HistoryDealsTotal();i++)
      {
         ulong tk=HistoryDealGetTicket(i);
         if(tk>0 && HistoryDealGetInteger(tk,DEAL_MAGIC)==InpMagic && HistoryDealGetString(tk,DEAL_SYMBOL)==_Symbol)
            cl+=HistoryDealGetDouble(tk,DEAL_PROFIT)+HistoryDealGetDouble(tk,DEAL_COMMISSION)+HistoryDealGetDouble(tk,DEAL_SWAP);
      }
   double fl=0;
   for(int i=PositionsTotal()-1;i>=0;i--)
      if(posInfo.SelectByIndex(i) && posInfo.Symbol()==_Symbol && posInfo.Magic()==InpMagic)
         fl+=posInfo.Profit()+posInfo.Commission()+posInfo.Swap();
   return cl+fl;
}

void ResetDailyTracking()
{
   int tz=Broker_GMT_Offset-7, rh=5+tz;
   if(rh<0)rh+=24; if(rh>=24)rh-=24;
   MqlDateTime now; TimeToStruct(TimeCurrent(),now);
   MqlDateTime rt; rt.year=now.year;rt.mon=now.mon;rt.day=now.day;rt.hour=rh;rt.min=0;rt.sec=0;
   datetime tdr=StructToTime(rt);
   if(!((TimeCurrent()>=tdr)&&(LastResetDate<tdr))) return;

   DailyStartBalance=AccountInfoDouble(ACCOUNT_BALANCE);
   LastResetDate=TimeCurrent();
   ManualPositionsClosedCount=0; LastManualResetTime=0;
   LastCloseAllTime=0; InCloseAllCooldown=false;
   // JANGAN reset EA_Paused di sini - biarkan state pause tetap sampai user ON dari dashboard
   ResetHedgeTrackers(); ResetZeroCrossState();

   // Auto_Restart_Next_Day: hanya reset internal flag EA_Enabled
   // TIDAK mengubah GV EA_STATUS_ -> EA tetap OFF sampai user ON dari dashboard
   // Ini mencegah EA ON sendiri di pagi hari
   if(Auto_Restart_Next_Day && (DailyTargetReached || DailyLossHit))
   {
      EA_Enabled = true;
      // GV EA_STATUS_ sengaja TIDAK diubah - user harus ON dari dashboard
      Print("[DAILY RESET] EA_Enabled direset. ON dari dashboard untuk mulai trading hari ini.");
   }

   DailyTargetReached = false;
   DailyLossHit       = false;
   GlobalVariableSet("EA_DAILY_TARGET_"+TerminalId, 0);
   GlobalVariableSet("EA_DAILY_LOSS_"+TerminalId,   0);
   Print("DAILY RESET 05:00 WIB | Balance: $",DoubleToString(DailyStartBalance,2));
   Print("[DAILY RESET] EA Status GV tetap: ",
         GlobalVariableCheck(GlobalVarName)&&GlobalVariableGet(GlobalVarName)==1?"ON":"OFF",
         " | ON dari dashboard untuk mulai trading");
}

bool CheckTradingTime()
{
   if(!ActiveUseTradingTime) return true;
   MqlDateTime now; TimeToStruct(TimeCurrent(),now);
   int tz=Broker_GMT_Offset-7;
   int sh=ActiveTradeStartMin/60+tz; int eh=ActiveTradeEndMin/60+tz;
   if(sh<0)sh+=24;if(sh>=24)sh-=24;if(eh<0)eh+=24;if(eh>=24)eh-=24;
   int cur=now.hour*60+now.min;
   int sm=sh*60+(ActiveTradeStartMin%60);
   int em=eh*60+(ActiveTradeEndMin%60);
   // Normalize after minute wrap
   if(sm<0)sm+=24*60; if(sm>=24*60)sm-=24*60;
   if(em<0)em+=24*60; if(em>=24*60)em-=24*60;
   bool inT=(sm<=em)?(cur>=sm&&cur<em):(cur>=sm||cur<em);

   static bool wasIn=true;
   if(wasIn && !inT)
   {
      // Jam trading habis: close posisi dan set EA OFF
      if(BUY_LayerCount+SELL_LayerCount>0)
      { Print("[TIME] Jam trading habis - Closing all positions"); CloseAllPositionsBulk(); }
      GlobalVariableSet(GlobalVarName, 0);
      Print("[TIME] EA di-OFF otomatis karena jam trading habis");
      // Tidak ada auto ON - EA hanya bisa ON kembali via dashboard / tombol chart
   }
   wasIn=inT;
   return inT;
}

void CheckDailyTarget()
{
   if(ActiveDailyTarget<=0) return;
   double pnl=GetDailyPnL();
   if(pnl>=ActiveDailyTarget&&!DailyTargetReached)
   {
      Print("[TARGET] DAILY TARGET HIT! $",DoubleToString(pnl,2));
      CloseAllBuyPositions();Sleep(100);CloseAllSellPositions();Sleep(100);
      DailyTargetReached=true;EA_Enabled=false;ResetZeroCrossState();GlobalVariableSet("EA_DAILY_TARGET_"+TerminalId,1);
   }
}

void CheckDailyLoss()
{
   if(ActiveDailyCutloss<=0) return;
   double flt=CalculateBuySideProfit()+CalculateSellSideProfit();
   if(flt<=-ActiveDailyCutloss&&!DailyLossHit)
   {
      Print("[STOP] LOSS LIMIT! $",DoubleToString(flt,2));
      DailyLossHit=true;EA_Enabled=false;GlobalVariableSet("EA_DAILY_LOSS_"+TerminalId,1);ResetZeroCrossState();
      for(int att=0;att<3;att++)
      {
         CloseAllBuyPositions();Sleep(100);CloseAllSellPositions();Sleep(100);
         int rem=0; for(int i=PositionsTotal()-1;i>=0;i--) if(posInfo.SelectByIndex(i)) if(posInfo.Symbol()==_Symbol&&posInfo.Magic()==InpMagic) rem++;
         if(!rem) break;
      }
   }
}

void CheckAndHandleManualPositions()
{
   if(!Protect_From_Manual_Actions) return;
   if(TimeCurrent()-LastManualCheckTime<Manual_Position_Check_Seconds) return;
   LastManualCheckTime=TimeCurrent();
   ulong mt[]; int mc=0;
   for(int i=PositionsTotal()-1;i>=0;i--)
      if(posInfo.SelectByIndex(i) && posInfo.Symbol()==_Symbol && posInfo.Magic()!=InpMagic)
      { ArrayResize(mt,mc+1);mt[mc]=posInfo.Ticket();mc++; }
   if(mc>0&&Auto_Close_Manual_Positions) for(int i=0;i<mc;i++) if(trade.PositionClose(mt[i])) ManualPositionsClosedCount++;
}

int GetRSISignal()
{
   double rsi[]; ArraySetAsSeries(rsi,true);
   if(CopyBuffer(RSI_Handle,0,0,3,rsi)<=0) return 0;
   double c=rsi[0],p=rsi[1];
   if(c<=RSI_Oversold||(p<=RSI_Oversold&&c>p)) return 1;
   if(c>=RSI_Overbought||(p>=RSI_Overbought&&c<p)) return -1;
   return 0;
}

void CheckInitialEntry()
{
   if(EA_Paused) return;
   if(MaxLayerBlocked) return;
   if(BUY_LayerCount>0||SELL_LayerCount>0) return;
   if(IsInCloseAllCooldown()) return;
   if(!CheckSpread()) return;

   double ask=SymbolInfoDouble(_Symbol,SYMBOL_ASK);
   double bid=SymbolInfoDouble(_Symbol,SYMBOL_BID);

   if(ActiveEntryMode == ENTRY_TWO_WAY)
   {
      bool bOK=trade.Buy(BaseLot,_Symbol,0,0,0,BuildComment(Comment_Buy)); Sleep(50);
      bool sOK=trade.Sell(BaseLot,_Symbol,0,0,0,BuildComment(Comment_Sell));
      if(bOK||sOK) Print("[ENTRY TWO_WAY] BUY:",bOK?"OK":"FAIL"," | SELL:",sOK?"OK":"FAIL");
      else { LogTradeFail("ENTRY TWO_WAY BUY"); LogTradeFail("ENTRY TWO_WAY SELL"); }
   }
   else
   {
      int sig=GetRSISignal();
      if(sig==1)
      {
         if(trade.Buy(BaseLot,_Symbol,0,0,0,BuildComment(Comment_Buy))) Print("[ENTRY ONE_WAY] BUY @ ",ask);
         else LogTradeFail("ENTRY ONE_WAY BUY");
      }
      else if(sig==-1)
      {
         if(trade.Sell(BaseLot,_Symbol,0,0,0,BuildComment(Comment_Sell))) Print("[ENTRY ONE_WAY] SELL @ ",bid);
         else LogTradeFail("ENTRY ONE_WAY SELL");
      }
   }
}

double GetNextLotFromPositions(ENUM_POSITION_TYPE posType)
{
   if(ActiveMartingaleMode == MODE_AGGRESSIVE)
   {
      // Aggressive: cari lot TERBESAR yang ada di posisi saat ini
      // lalu kali ActiveLotMultiplier -> konsisten walau multiplier diganti di tengah jalan
      double deepestLot = 0;
      for(int i=PositionsTotal()-1;i>=0;i--)
         if(posInfo.SelectByIndex(i) && posInfo.Symbol()==_Symbol && posInfo.Magic()==InpMagic && posInfo.PositionType()==posType)
            if(posInfo.Volume() > deepestLot) deepestLot = posInfo.Volume();

      double nextLot = (deepestLot > 0) ? deepestLot * ActiveLotMultiplier : BaseLot;

      double minL=SymbolInfoDouble(_Symbol,SYMBOL_VOLUME_MIN), maxL=SymbolInfoDouble(_Symbol,SYMBOL_VOLUME_MAX), stepL=SymbolInfoDouble(_Symbol,SYMBOL_VOLUME_STEP);
      nextLot = MathFloor(nextLot/stepL)*stepL;
      if(nextLot < minL) nextLot = minL;
      if(ActiveMaxLot > 0 && nextLot > ActiveMaxLot) nextLot = ActiveMaxLot;
      if(nextLot > maxL) nextLot = maxL;
      return nextLot;
   }

   // Conservative: baca lot terbesar dari posisi, naik setelah LayersPerLotIncrease
   double dL=0;
   for(int i=PositionsTotal()-1;i>=0;i--)
      if(posInfo.SelectByIndex(i) && posInfo.Symbol()==_Symbol && posInfo.Magic()==InpMagic && posInfo.PositionType()==posType)
         if(posInfo.Volume()>dL) dL=posInfo.Volume();
   if(dL<=0) return BaseLot;
   int cnt=0;
   for(int i=PositionsTotal()-1;i>=0;i--)
      if(posInfo.SelectByIndex(i) && posInfo.Symbol()==_Symbol && posInfo.Magic()==InpMagic && posInfo.PositionType()==posType)
         if(MathAbs(posInfo.Volume()-dL)<0.0001) cnt++;
   double nl=(cnt>=LayersPerLotIncrease)?dL+LotIncrement:dL;
   double minL=SymbolInfoDouble(_Symbol,SYMBOL_VOLUME_MIN),maxL=SymbolInfoDouble(_Symbol,SYMBOL_VOLUME_MAX),stepL=SymbolInfoDouble(_Symbol,SYMBOL_VOLUME_STEP);
   nl=MathFloor(nl/stepL)*stepL; if(nl<minL)nl=minL;
   if(ActiveMaxLot>0&&nl>ActiveMaxLot)nl=ActiveMaxLot; if(nl>maxL)nl=maxL;
   return nl;
}

void CheckBuyMartingale()
{
   if(EA_Paused) return;
   if(MaxLayerBlocked) return;
   if(BUY_LayerCount==0||BUY_LayerCount>=MaxLayers) return;
   // ONE_WAY: jangan tambah layer BUY kalau ada posisi SELL aktif
   if(ActiveEntryMode==ENTRY_ONE_WAY && SELL_LayerCount>0) return;
   if(!CheckSpread()) return;
   double ask=SymbolInfoDouble(_Symbol,SYMBOL_ASK);
   if(BUY_LastEntry - ask >= ConvertPointsToPrice(ActiveLayerDistance))
   {
      int nl=BUY_LayerCount+1; double lots=GetNextLotFromPositions(POSITION_TYPE_BUY);
      int cs=0;
      for(int i=PositionsTotal()-1;i>=0;i--)
         if(posInfo.SelectByIndex(i)&&posInfo.Symbol()==_Symbol&&posInfo.Magic()==InpMagic&&posInfo.PositionType()==POSITION_TYPE_BUY)
            if(MathAbs(posInfo.Volume()-lots)<0.0001) cs++;
      if(cs>=LayersPerLotIncrease){lots+=LotIncrement;Print("[WARN] BUY safeguard: lot->",DoubleToString(lots,2));}
      if(ActiveMaxLot>0&&lots>ActiveMaxLot)lots=ActiveMaxLot;
      if(trade.Buy(lots,_Symbol,0,0,0,BuildComment(Comment_Buy,nl)))
      {
         Print("BUY L",nl," lot:",DoubleToString(lots,2)," | Layer:",DoubleToString(ActiveLayerDistance,0),"pts | ",ActiveMartingaleModeName,ActiveMartingaleMode==MODE_AGGRESSIVE?" x"+DoubleToString(ActiveLotMultiplier,2):"");
         Sleep(100); UpdateBuySideData();
      }
      else LogTradeFail("BUY L"+IntegerToString(nl));
   }
}

void CheckSellMartingale()
{
   if(EA_Paused) return;
   if(MaxLayerBlocked) return;
   if(SELL_LayerCount==0||SELL_LayerCount>=MaxLayers) return;
   // ONE_WAY: jangan tambah layer SELL kalau ada posisi BUY aktif
   if(ActiveEntryMode==ENTRY_ONE_WAY && BUY_LayerCount>0) return;
   if(!CheckSpread()) return;
   double bid=SymbolInfoDouble(_Symbol,SYMBOL_BID);
   if(bid - SELL_LastEntry >= ConvertPointsToPrice(ActiveLayerDistance))
   {
      int nl=SELL_LayerCount+1; double lots=GetNextLotFromPositions(POSITION_TYPE_SELL);
      int cs=0;
      for(int i=PositionsTotal()-1;i>=0;i--)
         if(posInfo.SelectByIndex(i)&&posInfo.Symbol()==_Symbol&&posInfo.Magic()==InpMagic&&posInfo.PositionType()==POSITION_TYPE_SELL)
            if(MathAbs(posInfo.Volume()-lots)<0.0001) cs++;
      if(cs>=LayersPerLotIncrease){lots+=LotIncrement;Print("[WARN] SELL safeguard: lot->",DoubleToString(lots,2));}
      if(ActiveMaxLot>0&&lots>ActiveMaxLot)lots=ActiveMaxLot;
      if(trade.Sell(lots,_Symbol,0,0,0,BuildComment(Comment_Sell,nl)))
      {
         Print("SELL L",nl," lot:",DoubleToString(lots,2)," | Layer:",DoubleToString(ActiveLayerDistance,0),"pts | ",ActiveMartingaleModeName,ActiveMartingaleMode==MODE_AGGRESSIVE?" x"+DoubleToString(ActiveLotMultiplier,2):"");
         Sleep(100); UpdateSellSideData();
      }
      else LogTradeFail("SELL L"+IntegerToString(nl));
   }
}

void CheckContinuousHedging()
{
   if(ActiveEntryMode == ENTRY_ONE_WAY) return;
   if(!Enable_Hedging) return;
   if(!CheckSpread()) return;
   double hDist = ConvertPointsToPrice(ActiveHedgeDistance);

   if(BUY_LayerCount>=Hedging_Start_Layer && SELL_LayerCount==0)
   {
      double cBid=SymbolInfoDouble(_Symbol,SYMBOL_BID);
      bool dOK=(ActiveHedgeDistance<=0)||(cBid>=BUY_LastEntry+hDist);
      bool needH=(BUY_LayerCount>BUY_Last_Hedged_Layer||BUY_Last_Hedged_Layer>0)&&dOK;
      if(needH)
      {
         if(trade.Sell(BaseLot,_Symbol,0,0,0,BuildComment(Comment_Sell)))
         { Print("[HEDGE] SELL | BUY L",BUY_LayerCount," | Dist:",DoubleToString(ActiveHedgeDistance,0),"pts"); BUY_Last_Hedged_Layer=BUY_LayerCount; }
         else LogTradeFail("HEDGE SELL");
      }
   }
   if(SELL_LayerCount>=Hedging_Start_Layer && BUY_LayerCount==0)
   {
      double cAsk=SymbolInfoDouble(_Symbol,SYMBOL_ASK);
      bool dOK=(ActiveHedgeDistance<=0)||(cAsk<=SELL_LastEntry-hDist);
      bool needH=(SELL_LayerCount>SELL_Last_Hedged_Layer||SELL_Last_Hedged_Layer>0)&&dOK;
      if(needH)
      {
         if(trade.Buy(BaseLot,_Symbol,0,0,0,BuildComment(Comment_Buy)))
         { Print("[HEDGE] BUY | SELL L",SELL_LayerCount," | Dist:",DoubleToString(ActiveHedgeDistance,0),"pts"); SELL_Last_Hedged_Layer=SELL_LayerCount; }
         else LogTradeFail("HEDGE BUY");
      }
   }
}

#define UI_PAD_X     8
#define UI_PAD_Y     8
#define UI_PANEL_W   228
#define UI_BTN_GAP   6
#define UI_CONTENT_W (UI_PANEL_W - UI_PAD_X*2)   // 212
#define UI_HALF_W    ((UI_CONTENT_W - UI_BTN_GAP) / 2) // 103

void CreatePanelBg(string name, int x, int y, int w, int h)
{
   // Card "gelas gelap" di atas chart — candle tidak menutupi text
   // (MT5 object color tidak punya alpha channel yang andal)
   if(ObjectFind(0,name)<0)
   {
      ObjectCreate(0,name,OBJ_RECTANGLE_LABEL,0,0,0);
      ObjectSetInteger(0,name,OBJPROP_CORNER,CORNER_LEFT_UPPER);
      ObjectSetInteger(0,name,OBJPROP_BORDER_TYPE,BORDER_FLAT);
      ObjectSetInteger(0,name,OBJPROP_BACK,false);
      ObjectSetInteger(0,name,OBJPROP_SELECTABLE,false);
      ObjectSetInteger(0,name,OBJPROP_ZORDER,0);
   }
   ObjectSetInteger(0,name,OBJPROP_XDISTANCE,x);
   ObjectSetInteger(0,name,OBJPROP_YDISTANCE,y);
   ObjectSetInteger(0,name,OBJPROP_XSIZE,w);
   ObjectSetInteger(0,name,OBJPROP_YSIZE,h);
   ObjectSetInteger(0,name,OBJPROP_BGCOLOR,C'12,14,20');
   ObjectSetInteger(0,name,OBJPROP_COLOR,C'70,80,100');
}

void CreateLabel(string name, int x, int y, string text, color clr, int fontSize=7)
{
   if(ObjectFind(0,name)<0)
   {
      ObjectCreate(0,name,OBJ_LABEL,0,0,0);
      ObjectSetInteger(0,name,OBJPROP_CORNER,CORNER_LEFT_UPPER);
      ObjectSetString(0,name,OBJPROP_FONT,"Arial");
      ObjectSetInteger(0,name,OBJPROP_SELECTABLE,false);
      ObjectSetInteger(0,name,OBJPROP_ZORDER,1);
   }
   ObjectSetInteger(0,name,OBJPROP_FONTSIZE,fontSize);
   ObjectSetInteger(0,name,OBJPROP_XDISTANCE,x);
   ObjectSetInteger(0,name,OBJPROP_YDISTANCE,y);
   ObjectSetString(0,name,OBJPROP_TEXT,text);
   ObjectSetInteger(0,name,OBJPROP_COLOR,clr);
}

void CreateButton(string name, int x, int y, int w, int h, string text, color bgColor)
{
   if(ObjectFind(0,name)<0)
   {
      ObjectCreate(0,name,OBJ_BUTTON,0,0,0);
      ObjectSetInteger(0,name,OBJPROP_CORNER,CORNER_LEFT_UPPER);
      ObjectSetString(0,name,OBJPROP_FONT,"Arial");
      ObjectSetInteger(0,name,OBJPROP_ZORDER,2);
   }
   ObjectSetInteger(0,name,OBJPROP_XSIZE,w);
   ObjectSetInteger(0,name,OBJPROP_YSIZE,h);
   ObjectSetInteger(0,name,OBJPROP_FONTSIZE,8);
   ObjectSetInteger(0,name,OBJPROP_XDISTANCE,x);
   ObjectSetInteger(0,name,OBJPROP_YDISTANCE,y);
   ObjectSetString(0,name,OBJPROP_TEXT,text);
   ObjectSetInteger(0,name,OBJPROP_BGCOLOR,bgColor);
   ObjectSetInteger(0,name,OBJPROP_COLOR,clrWhite);
}

void UpdateInfoPanel()
{
   double bPnL=CalculateBuySideProfit(),sPnL=CalculateSellSideProfit(),tPnL=bPnL+sPnL;
   double dPnL=GetDailyPnL(),bal=AccountInfoDouble(ACCOUNT_BALANCE),eq=AccountInfoDouble(ACCOUNT_EQUITY);
   int tp=BUY_LayerCount+SELL_LayerCount; double tl=BUY_TotalVolume+SELL_TotalVolume;
   int panelX=6, panelY=6;
   int x=panelX+UI_PAD_X, y=panelY+UI_PAD_Y, lh=14;
   string p="InfoPanel_";
   color W=clrWhite,G=clrLime,R=clrRed;
   double eaSt=GlobalVariableCheck(GlobalVarName)?GlobalVariableGet(GlobalVarName):0;
   string sTxt=eaSt==1?"ON":"OFF"; color sClr=eaSt==1?G:R;
   if(EA_Paused&&eaSt==1){sTxt="PAUSED";sClr=clrOrange;}

   // Panel dibuat dulu; tinggi di-update di akhir setelah layout selesai
   CreatePanelBg(p+"BG", panelX, panelY, UI_PANEL_W, 40);

   CreateLabel(p+"1",x,y,"SMART EA v1.1  HYBRID TP",clrGold,9);y+=lh+2;
   CreateLabel(p+"EM",x,y,"Entry: "+ActiveEntryModeName+(ActiveEntryMode==ENTRY_ONE_WAY?" (RSI)":" (BUY+SELL)"),ActiveEntryMode==ENTRY_ONE_WAY?clrSkyBlue:clrYellow);y+=lh;

   string mStr="Mode: "+ActiveMartingaleModeName+(ActiveMartingaleMode==MODE_AGGRESSIVE?" x"+DoubleToString(ActiveLotMultiplier,2):"");
   CreateLabel(p+"3",x,y,mStr,ActiveMartingaleMode==MODE_AGGRESSIVE?clrOrangeRed:clrSkyBlue);y+=lh;

   string hStr=Use_Hedge_Distance?StringFormat("Hedge:%.0fpts",ActiveHedgeDistance):"Hedge:OFF";
   CreateLabel(p+"LAYER",x,y,StringFormat("Layer: %.0f pts | %s",ActiveLayerDistance,hStr),clrYellow,7);y+=lh;

   string maxLotStr  = ActiveMaxLot   <= 0 ? "MaxLot: OFF"   : StringFormat("MaxLot: %.2f", ActiveMaxLot);
   string maxLayerStr= ActiveMaxLayer  <= 0 ? "MaxLayer: OFF" : StringFormat("MaxLayer: %d", ActiveMaxLayer);
   CreateLabel(p+"MAXINFO",x,y,maxLotStr+" | "+maxLayerStr,clrSilver,7);y+=lh;

   CreateLabel(p+"BROKER",x,y,StringFormat("Broker %dD | 1000pts ≈ $%.2f",BrokerDigits,1000*PointNormFactor),clrSilver,6);y+=lh+2;

   if(Use_Spread_Filter){color sc=SpreadTooHigh?clrOrange:G;CreateLabel(p+"SPR",x,y,StringFormat("%s %.1f/%.1f",SpreadTooHigh?"Spread:HIGH":"Spread:OK",CurrentSpread,Max_Spread_Points),sc);y+=lh;}

   if(EA_Paused){CreateLabel(p+"PBANNER",x,y,"[PAUSE] Entry blocked — TP aktif",clrOrange,7);y+=lh;}
   else ObjectDelete(0,p+"PBANNER");

   if(MaxLayerBlocked)
   {
      int tot=BUY_LayerCount+SELL_LayerCount;
      CreateLabel(p+"MLBANNER",x,y,StringFormat("[MAXLAYER] L%d/%d — tunggu flat",tot,ActiveMaxLayer),clrOrange,7);
      y+=lh;
   }
   else ObjectDelete(0,p+"MLBANNER");

   if(InCloseAllCooldown&&Use_CloseAll_Cooldown){int rem=CloseAll_Cooldown_Seconds-(int)(TimeCurrent()-LastCloseAllTime);if(rem<0)rem=0;CreateLabel(p+"CDwn",x,y,StringFormat("[COOLDOWN] %ds",rem),clrOrange,7);y+=lh;}
   else ObjectDelete(0,p+"CDwn");

   CreateLabel(p+"4",x,y,"— ACCOUNT —",clrSilver,7);y+=lh;
   CreateLabel(p+"ACCID",x,y,"ID: "+Account_ID,clrSilver,7);y+=lh;
   CreateLabel(p+"5",x,y,StringFormat("Bal $%.0f  |  Eq $%.0f",bal,eq),W);y+=lh;
   CreateLabel(p+"7",x,y,StringFormat("Daily: %s$%.2f",dPnL>=0?"+":"",dPnL),dPnL>=0?G:R);y+=lh;

   string tStr=ActiveDailyTarget<=0?"Target: DISABLED":StringFormat("Target: $%.0f (%.0f%%)",ActiveDailyTarget,ActiveDailyTarget>0?(dPnL/ActiveDailyTarget)*100:0);
   string cStr=ActiveDailyCutloss<=0?"Cutloss: DISABLED":StringFormat("Cutloss: $%.0f",ActiveDailyCutloss);
   CreateLabel(p+"TGT",x,y,tStr,ActiveDailyTarget>0&&dPnL>=ActiveDailyTarget?G:W,7);y+=lh;
   CreateLabel(p+"CUT",x,y,cStr,ActiveDailyCutloss>0&&dPnL<=-ActiveDailyCutloss?R:W,7);y+=lh+2;

   CreateLabel(p+"8",x,y,"— POSITIONS —",clrSilver,7);y+=lh;
   CreateLabel(p+"9",x,y,StringFormat("BUY %d (%.2f)   SELL %d (%.2f)",BUY_LayerCount,BUY_TotalVolume,SELL_LayerCount,SELL_TotalVolume),W);y+=lh;
   CreateLabel(p+"11",x,y,StringFormat("Total %d pos  |  %.2f lot",tp,tl),W);y+=lh;

   if(Enable_Hedging && ActiveEntryMode==ENTRY_TWO_WAY)
   {
      CreateLabel(p+"HDG_S",x,y,BUY_LayerCount>=2?StringFormat("HDG-SELL: L%d tracked",BUY_Last_Hedged_Layer):"HDG-SELL: standby",clrAqua,7);y+=lh;
      CreateLabel(p+"HDG_B",x,y,SELL_LayerCount>=2?StringFormat("HDG-BUY: L%d tracked",SELL_Last_Hedged_Layer):"HDG-BUY: standby",clrAqua,7);y+=lh;
   }
   else
   {
      ObjectDelete(0,p+"HDG_S");
      ObjectDelete(0,p+"HDG_B");
   }

   bool inZC=(ActiveEntryMode==ENTRY_ONE_WAY)&&(BUY_LayerCount>=ZeroCross_Trigger_Layer||SELL_LayerCount>=ZeroCross_Trigger_Layer);
   string tpModeLabel;
   if(ActiveEntryMode == ENTRY_TWO_WAY)
      tpModeLabel = "TP: PER-SIDE (DUA ARAH)";
   else if(inZC)
      tpModeLabel = "TP: ZERO CROSS MODE";
   else
      tpModeLabel = "TP: ONE SIDE (SATU ARAH)";
   CreateLabel(p+"14",x,y,tpModeLabel,ActiveEntryMode==ENTRY_TWO_WAY?clrYellow:(inZC?clrAqua:clrYellow));y+=lh;
   CreateLabel(p+"17",x,y,StringFormat("Float: %s$%.2f",tPnL>=0?"+":"",tPnL),tPnL>=0?G:R);y+=lh;
   ObjectDelete(0,p+"ZC0");ObjectDelete(0,p+"ZC1");ObjectDelete(0,p+"ZC2");ObjectDelete(0,p+"ZC3");
   double tpD=ConvertPointsToPrice(Single_Layer_TP_Points);
   double tpDMulti=ConvertPointsToPrice(Multi_Layer_TP_Points);
   if(!tp){CreateLabel(p+"ZC0",x,y,"Tidak ada posisi",clrSilver,7);y+=lh;}
   else if(ActiveEntryMode == ENTRY_TWO_WAY)
   {
      if(BUY_LayerCount>0)
      {
         double bTP = (BUY_LayerCount==1) ? BUY_FirstEntry+tpD : BUY_AveragePrice+tpDMulti;
         CreateLabel(p+"ZC0",x,y,StringFormat("BUY L%d avg %s TP@%s",BUY_LayerCount,DoubleToString(BUY_AveragePrice,_Digits),DoubleToString(bTP,_Digits)),clrYellow,7);y+=lh;
      }
      if(SELL_LayerCount>0)
      {
         double sTP = (SELL_LayerCount==1) ? SELL_FirstEntry-tpD : SELL_AveragePrice-tpDMulti;
         CreateLabel(p+"ZC1",x,y,StringFormat("SELL L%d avg %s TP@%s",SELL_LayerCount,DoubleToString(SELL_AveragePrice,_Digits),DoubleToString(sTP,_Digits)),clrYellow,7);y+=lh;
      }
      if(Use_Advanced_Partial_TP)
      {
         CreateLabel(p+"ZC2",x,y,StringFormat("PartialTP: MinGrp%d Thresh%d",Partial_TP_Min_Group,Partial_TP_Group_Threshold),clrSilver,7);y+=lh;
      }
   }
   else if(!inZC)
   {
      if(BUY_LayerCount>0){CreateLabel(p+"ZC0",x,y,StringFormat("BUY L%d avg %s TP@%s",BUY_LayerCount,DoubleToString(BUY_AveragePrice,_Digits),DoubleToString(BUY_AveragePrice+tpD,_Digits)),clrYellow,7);y+=lh;}
      if(SELL_LayerCount>0){CreateLabel(p+"ZC1",x,y,StringFormat("SELL L%d avg %s TP@%s",SELL_LayerCount,DoubleToString(SELL_AveragePrice,_Digits),DoubleToString(SELL_AveragePrice-tpD,_Digits)),clrYellow,7);y+=lh;}
      CreateLabel(p+"ZC2",x,y,StringFormat("ZeroCross saat L>=%d",ZeroCross_Trigger_Layer),clrSilver,7);y+=lh;
   }
   else
   {
      CreateLabel(p+"ZC0",x,y,StringFormat("BUY L%d | SELL L%d | Trig>=L%d",BUY_LayerCount,SELL_LayerCount,ZeroCross_Trigger_Layer),clrSilver,7);y+=lh;
      if(ZeroCross_Triggered)
      {
         CreateLabel(p+"ZC1",x,y,StringFormat("Zero @ %s (+%.0fpts)",DoubleToString(ZeroCrossPrice,_Digits),ZeroCross_TP_Points),clrAqua,7);y+=lh;
         CreateLabel(p+"ZC2",x,y,StringFormat("TP @ %s [%s]",DoubleToString(ZeroCross_TPPrice,_Digits),ZeroCross_Direction==1?"Bid":"Ask"),clrYellow,7);y+=lh;
         double rP=ZeroCross_Direction==1?SymbolInfoDouble(_Symbol,SYMBOL_BID):SymbolInfoDouble(_Symbol,SYMBOL_ASK);
         double rPts=ZeroCross_Direction==1?(ZeroCross_TPPrice-rP)/PointNormFactor:(rP-ZeroCross_TPPrice)/PointNormFactor;
         CreateLabel(p+"ZC3",x,y,StringFormat("Sisa: %.1f pts ke ZeroTP",rPts),rPts<=0?G:clrOrange,7);y+=lh;
      }
      else{CreateLabel(p+"ZC1",x,y,StringFormat("Menunggu float=0 (+%.0fpts)",ZeroCross_TP_Points),clrSilver,7);y+=lh;}
   }

   if(WaitingForReentry){int rs=Reentry_Delay_Seconds-(int)(TimeCurrent()-LastAutoCloseTime);if(rs<0)rs=0;string dirLbl=(ReentryDirection==1)?"BUY":(ReentryDirection==-1)?"SELL":(ReentryDirection==2)?"RSI":"?";CreateLabel(p+"17C",x,y,StringFormat("Re-entry %s: %ds",dirLbl,rs),ReentryDirection==1?G:R);y+=lh;}
   else ObjectDelete(0,p+"17C");

   if(ActiveUseTradingTime){bool inT=CheckTradingTime();CreateLabel(p+"27",x,y,inT?StringFormat("Hours OK  %02d:%02d–%02d:%02d",ActiveTradeStartMin/60,ActiveTradeStartMin%60,ActiveTradeEndMin/60,ActiveTradeEndMin%60):StringFormat("OUTSIDE  %02d:%02d–%02d:%02d",ActiveTradeStartMin/60,ActiveTradeStartMin%60,ActiveTradeEndMin/60,ActiveTradeEndMin%60),inT?G:R);y+=lh;}

   y+=8;
   color btnC=(eaSt==1&&!EA_Paused)?C'0,160,80':EA_Paused?C'200,120,0':C'180,40,40';
   CreateButton(p+"BtnToggle",x,y,UI_CONTENT_W,34,sTxt,btnC);y+=38;
   CreateButton(p+"BtnPause",x,y,UI_CONTENT_W,28,EA_Paused?"PAUSED":"PAUSE ENTRY",EA_Paused?C'200,120,0':C'55,58,66');y+=32;
   CreateButton(p+"BtnReset",x,y,UI_CONTENT_W,28,"RESET TARGET",C'220,120,30');y+=34;

   // Entry mode — half width, teks singkat yang muat
   CreateButton(p+"BtnTwoWay",x, y, UI_HALF_W, 26, "2 ARAH",
                ActiveEntryMode==ENTRY_TWO_WAY?C'0,140,70':C'45,48,55');
   CreateButton(p+"BtnOneWay",x+UI_HALF_W+UI_BTN_GAP, y, UI_HALF_W, 26, "1 ARAH",
                ActiveEntryMode==ENTRY_ONE_WAY?C'0,140,70':C'45,48,55');
   y+=30;

   // Martingale — full width agar teks tidak terpotong
   CreateButton(p+"BtnCons",x,y,UI_CONTENT_W,26,"CONSERVATIVE",
                ActiveMartingaleMode==MODE_CONSERVATIVE?C'0,140,70':C'45,48,55');
   y+=30;
   CreateButton(p+"BtnAgg",x,y,UI_CONTENT_W,26,"AGGRESSIVE",
                ActiveMartingaleMode==MODE_AGGRESSIVE?C'0,140,70':C'45,48,55');
   y+=34;

   CreateLabel(p+"TG_Status", x,y,"Status: "+sTxt,sClr,7);y+=lh;
   CreateLabel(p+"TG_TerminalId", x,y,"Terminal: "+TerminalId,W,7);y+=lh;
   CreateLabel(p+"TG_AccID",  x,y,"ID: "+Account_ID,W,7);y+=lh;
   color expClr=LicenceExpired?clrOrangeRed:(GlobalVariableCheck(ExpiresVarName)&&GlobalVariableGet(ExpiresVarName)>0?clrLime:clrSilver);
   CreateLabel(p+"TG_Expired",x,y,LicenceExpiryLabel(),expClr,7);y+=lh;
   if(LicenceExpired)
   { CreateLabel(p+"TG_ExpBan",x,y,"LICENCE EXPIRED — entry blocked",clrOrangeRed,7); y+=lh; }
   else ObjectDelete(0,p+"TG_ExpBan");

   // Hapus separator lama (dari versi sebelumnya) jika masih ada
   ObjectDelete(0,p+"0");
   ObjectDelete(0,p+"2");
   ObjectDelete(0,p+"30");

   int panelH = (y - panelY) + UI_PAD_Y;
   CreatePanelBg(p+"BG", panelX, panelY, UI_PANEL_W, panelH);
}

int OnInit()
{
   if(TerminalId == "" || TerminalId == "ISI_TERMINAL_ID")
   { Print("ERROR: TerminalId belum diisi! Harus sama dengan SMH_Controller_v1.1"); return INIT_FAILED; }
   for(int i=0;i<StringLen(TerminalId);i++)
   {
      ushort ch=StringGetCharacter(TerminalId,i);
      bool ok=(ch>='0'&&ch<='9')||(ch>='A'&&ch<='Z')||(ch>='a'&&ch<='z')||ch=='_'||ch=='-';
      if(!ok){Print("ERROR: TerminalId hanya [A-Za-z0-9_-]: ",TerminalId);return INIT_FAILED;}
   }

   GlobalVarName    = "EA_STATUS_"    + TerminalId;
   PauseVarName     = "EA_PAUSE_"     + TerminalId;
   TargetVarName    = "EA_TARGET_"    + TerminalId;
   CutlossVarName   = "EA_CUTLOSS_"   + TerminalId;
   ModeVarName      = "EA_MODE_"      + TerminalId;
   LayerVarName     = "EA_LAYER_"     + TerminalId;
   MultVarName      = "EA_MULT_"      + TerminalId;
   EntryModeVarName = "EA_ENTRYMODE_" + TerminalId;
   MaxLotVarName    = "EA_MAXLOT_"    + TerminalId;
   MaxLayerVarName  = "EA_MAXLAYER_"  + TerminalId;
   ExpiresVarName   = "EA_EXPIRES_"   + TerminalId;
   TradeTimeVarName = "EA_TRADETIME_" + TerminalId;
   TradeStartVarName= "EA_TRADE_START_"+ TerminalId;
   TradeEndVarName  = "EA_TRADE_END_" + TerminalId;

   Account_ID = Use_Auto_Account_ID ?
      IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) : Manual_Account_ID;

   // Default EA status = OFF saat GV belum ada (misal setelah MT5 restart)
   // User harus ON dari dashboard - EA tidak boleh ON sendiri
   if(!GlobalVariableCheck(GlobalVarName)) GlobalVariableSet(GlobalVarName, 0);
   if(!GlobalVariableCheck(PauseVarName))  GlobalVariableSet(PauseVarName, 0);
   if(!GlobalVariableCheck(ExpiresVarName)) GlobalVariableSet(ExpiresVarName, 0);
   EA_Paused = (GlobalVariableGet(PauseVarName) == 1);
   LicenceExpired = IsLicenceExpired();
   LicenceExpiryHandled = LicenceExpired;

   // Baca state daily target/loss dari GV supaya konsisten setelah restart
   DailyTargetReached = GlobalVariableCheck("EA_DAILY_TARGET_"+TerminalId) && GlobalVariableGet("EA_DAILY_TARGET_"+TerminalId)==1;
   DailyLossHit       = GlobalVariableCheck("EA_DAILY_LOSS_"+TerminalId)   && GlobalVariableGet("EA_DAILY_LOSS_"+TerminalId)==1;
   if(DailyTargetReached || DailyLossHit)
   {
      EA_Enabled = false;
      Print("[INIT] EA disabled - ",DailyTargetReached?"Daily Target sudah tercapai":"Daily Loss limit hit");
      Print("[INIT] Kirim /reset dari dashboard untuk mengaktifkan kembali");
   }

   SyncLayerDistance();
   SyncLotMultiplier();
   SyncEntryMode();
   SyncMartingaleMode();
   SyncDynamicLimits();
   SyncMaxLot();
   SyncMaxLayer();
   SyncTradingHours();
   ResetZeroCrossState();

   Print("========================================");
   Print("SMART EA v1.1 - ZERO CROSS TP");
   Print("Terminal   : ", TerminalId, " | Account: ", Account_ID);
   Print("Entry Mode : ", ActiveEntryModeName, ActiveEntryMode==ENTRY_TWO_WAY?" -> TP: Advanced Partial + Per-Side Avg":" -> TP: One Side + Zero Cross");
   Print("Mart. Mode : ", ActiveMartingaleModeName);
   Print("Layer Dist : ", DoubleToString(ActiveLayerDistance,1), " pts");
   Print("Lot Mult   : x", DoubleToString(ActiveLotMultiplier,2), ActiveMartingaleMode==MODE_CONSERVATIVE?" (unused, CONSERVATIVE)":"");
   Print("Hedge Dist : ", Use_Hedge_Distance?DoubleToString(ActiveHedgeDistance,1)+" pts":"OFF");
   Print("Target     : ", ActiveDailyTarget<=0?"DISABLED":"$"+DoubleToString(ActiveDailyTarget,2));
   Print("Cutloss    : ", ActiveDailyCutloss<=0?"DISABLED":"$"+DoubleToString(ActiveDailyCutloss,2));
   Print("Pause      : ", EA_Paused?"PAUSED":"NORMAL");
   Print("Licence    : ", LicenceExpiryLabel());
   Print("Control    : SMH_Controller_v1.1");
   Print("========================================");

   trade.SetExpertMagicNumber(InpMagic);
   trade.SetDeviationInPoints(50);
   trade.SetTypeFilling(ORDER_FILLING_IOC);

   BrokerDigits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);

   // PointNormFactor = _Point selalu
   // User input dalam "raw broker points" yang sama di semua broker
   // Exness  XAUUSD 3-digit (_Point=0.001): user input 1000 -> 1000*0.001 = 1.000 harga = $1
   // VTMarkets XAUUSD 2-digit (_Point=0.01): user input 1000 -> 1000*0.01 = 10.0 harga = $1
   // Konsisten: user selalu ketik angka yang sama untuk movement yang sama
   PipValue        = _Point;
   PointNormFactor = _Point;

   Print("========================================");
   Print("BROKER AUTO-DETECT");
   Print("   Symbol  : ", _Symbol);
   Print("   Digits  : ", BrokerDigits);
   Print("   _Point  : ", DoubleToString(_Point, 6));
   Print("   NormFactor: ", DoubleToString(PointNormFactor, 6));
   Print("   Verifikasi (harus $1 movement):");
   Print("   User input 1000 pts -> harga ", DoubleToString(1000*PointNormFactor, 4));
   Print("   User input  500 pts -> harga ", DoubleToString(500*PointNormFactor,  4));
   Print("   User input  200 pts -> harga ", DoubleToString(200*PointNormFactor,  4));
   Print("   (Exness 3D: 1000->1.000 | VTMarkets 2D: 1000->10.00)");
   Print("========================================");
   GlobalVariableSet("EA_BROKER_DIGITS_"+TerminalId, BrokerDigits);

   RSI_Handle = iRSI(_Symbol, RSI_Timeframe, RSI_Period, PRICE_CLOSE);
   if(RSI_Handle==INVALID_HANDLE){Print("RSI FAILED!");return INIT_FAILED;}

   DailyStartBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   int tz=Broker_GMT_Offset-7, rh=5+tz; if(rh<0)rh+=24;if(rh>=24)rh-=24;
   MqlDateTime now; TimeToStruct(TimeCurrent(),now);
   MqlDateTime ir; ir.year=now.year;ir.mon=now.mon;ir.day=now.day;ir.hour=rh;ir.min=0;ir.sec=0;
   datetime trt=StructToTime(ir);
   LastResetDate=(TimeCurrent()>=trt)?trt:trt-86400;
   if(GlobalVariableCheck(GlobalVarName)) LastGlobalVarValue=GlobalVariableGet(GlobalVarName);
   Print("EA READY!");
   Print("========================================");
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   IndicatorRelease(RSI_Handle);
   string pfx="InfoPanel_"; int tot=ObjectsTotal(0);
   for(int i=tot-1;i>=0;i--){string n=ObjectName(0,i);if(StringFind(n,pfx)==0)ObjectDelete(0,n);}
   Comment(""); Print("EA STOPPED");
}

void OnChartEvent(const int id, const long &lparam, const double &dparam, const string &sparam)
{
   if(id!=CHARTEVENT_OBJECT_CLICK) return;

   if(sparam=="InfoPanel_BtnToggle")
   {
      double cs=GlobalVariableCheck(GlobalVarName)?GlobalVariableGet(GlobalVarName):0, ns=cs==1?0:1;
      if(ns==1 && IsLicenceExpired())
      {
         Print("[LICENCE] BUTTON ON ditolak — licence expired");
         ObjectSetInteger(0,sparam,OBJPROP_STATE,false);Sleep(100);UpdateInfoPanel();
         return;
      }
      if(ns==0)
      {
         CloseAllPositionsBulk();
         EA_Paused=false; GlobalVariableSet(PauseVarName,0);
         WaitingForReentry=false; ReentryDirection=0;
      }
      else
      {
         EA_Paused=false; GlobalVariableSet(PauseVarName,0);
         WaitingForReentry=false; ReentryDirection=0;
      }
      GlobalVariableSet(GlobalVarName,ns); Print("BUTTON: EA ",ns==1?"ON":"OFF");
      ObjectSetInteger(0,sparam,OBJPROP_STATE,false);Sleep(100);UpdateInfoPanel();
   }
   if(sparam=="InfoPanel_BtnPause")
   {
      // Toggle: pause <-> resume (dashboard /pause atau /on juga bisa)
      EA_Paused=!EA_Paused;
      GlobalVariableSet(PauseVarName, EA_Paused?1:0);
      Print(EA_Paused?"[PAUSE] via chart button":"[RESUME] via chart button");
      ObjectSetInteger(0,sparam,OBJPROP_STATE,false);Sleep(100);UpdateInfoPanel();
   }
   if(sparam=="InfoPanel_BtnReset")
   {ResetTargetManual();ObjectSetInteger(0,sparam,OBJPROP_STATE,false);Sleep(100);UpdateInfoPanel();}
   if(sparam=="InfoPanel_BtnTwoWay")
   {GlobalVariableSet(EntryModeVarName,0);SyncEntryMode();Print("[ENTRY] DUA ARAH via button");ObjectSetInteger(0,sparam,OBJPROP_STATE,false);Sleep(100);UpdateInfoPanel();}
   if(sparam=="InfoPanel_BtnOneWay")
   {GlobalVariableSet(EntryModeVarName,1);SyncEntryMode();Print("[ENTRY] SATU ARAH via button");ObjectSetInteger(0,sparam,OBJPROP_STATE,false);Sleep(100);UpdateInfoPanel();}
   if(sparam=="InfoPanel_BtnCons")
   {GlobalVariableSet(ModeVarName,0);SyncMartingaleMode();ObjectSetInteger(0,sparam,OBJPROP_STATE,false);Sleep(100);UpdateInfoPanel();}
   if(sparam=="InfoPanel_BtnAgg")
   {GlobalVariableSet(ModeVarName,1);SyncMartingaleMode();ObjectSetInteger(0,sparam,OBJPROP_STATE,false);Sleep(100);UpdateInfoPanel();}
}

void OnTick()
{
   SyncLayerDistance(); SyncLotMultiplier();
   SyncEntryMode(); SyncMartingaleMode();
   SyncPauseState(); SyncDynamicLimits();
   SyncMaxLot(); SyncMaxLayer();
   SyncTradingHours();
   SyncLicenceExpiry();
   EnforceLicenceExpiry();

   string rstVar="EA_RESET_"+TerminalId;
   if(GlobalVariableCheck(rstVar)&&GlobalVariableGet(rstVar)==1)
   {Print("[RESET] from dashboard GV");GlobalVariableSet(rstVar,0);ResetTargetManual();}

   if(TimeCurrent()-LastGlobalVarCheck>=1)
   {
      LastGlobalVarCheck=TimeCurrent();
      if(GlobalVariableCheck(GlobalVarName))
      {
         double cgv=GlobalVariableGet(GlobalVarName);
         if(LastGlobalVarValue!=-1&&cgv!=LastGlobalVarValue)
         {
            Print("[SYNC] EA STATUS: ",LastGlobalVarValue==1?"ON":"OFF"," -> ",cgv==1?"ON":"OFF",
                  " (dari Controller/dashboard)");
            if(cgv==0&&LastGlobalVarValue==1)
            {
               CloseAllPositionsBulk();
               EA_Paused=false; GlobalVariableSet(PauseVarName,0);
               WaitingForReentry=false; ReentryDirection=0;
            }
            else if(cgv==1&&LastGlobalVarValue==0)
            {
               if(LicenceExpired)
               {
                  Print("[LICENCE] IGNORE ON — licence expired");
                  GlobalVariableSet(GlobalVarName,0);
               }
               else
               {
                  EA_Paused=false; GlobalVariableSet(PauseVarName,0);
                  WaitingForReentry=false; ReentryDirection=0;
               }
            }
         }
         LastGlobalVarValue=cgv;
      }
   }

   double ctrlSt=Backtest_Mode?1:(GlobalVariableCheck(GlobalVarName)?GlobalVariableGet(GlobalVarName):0);
   Comment(""); ResetDailyTracking(); UpdateBuySideData(); UpdateSellSideData(); IsInCloseAllCooldown();
   CheckMaxLayerBlock();

   bool inTime=CheckTradingTime();
   GlobalVariableSet("EA_TRADING_HOURS_"+TerminalId,inTime?1:0);

   if(LicenceExpired)
   { UpdateInfoPanel(); return; }

   if(DailyLossHit||DailyTargetReached)
   {if(BUY_LayerCount>0||SELL_LayerCount>0){CloseAllBuyPositions();CloseAllSellPositions();}UpdateInfoPanel();return;}

   CheckDailyTarget(); CheckDailyLoss();
   if(ctrlSt!=1||!EA_Enabled){UpdateInfoPanel();return;}

   if(!inTime){UpdateInfoPanel();return;}

   CheckAndHandleManualPositions();

   // TP SYSTEM — jalur beda per Entry Mode (jalan walau PAUSE)
   if(ActiveEntryMode == ENTRY_ONE_WAY)
   {
      CheckOneSideTP();
      CheckZeroCrossTP();
   }
   else
   {
      CheckAdvancedBuyPartialTP();
      CheckAdvancedSellPartialTP();
      CheckBuyTP_TwoWay();
      CheckSellTP_TwoWay();
   }
   CheckReentry();

   UpdateBuySideData(); UpdateSellSideData();

   CheckInitialEntry();

   UpdateBuySideData(); UpdateSellSideData();
   CheckBuyMartingale();
   CheckSellMartingale();
   CheckContinuousHedging();

   UpdateInfoPanel();
}
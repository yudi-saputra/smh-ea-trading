#property copyright "SMH EA Control"
#property version   "1.17"
#property strict

#include <Trade\Trade.mqh>

//--- Input Parameters
input string ApiBaseUrl       = "Masukan URL API";
input string TerminalId       = "Masukan Terminal / ID Trading";
input string ApiKey           = "Masukan API Key";
input int    CheckInterval    = 2;    // Poll command setiap N detik
input int    HeartbeatSeconds = 10;   // Push status ke API setiap N detik
input int    StatusLogSeconds = 60;   // Ringkasan OK ke Experts (0=off)
input bool   VerboseLog       = false; // Poll kosong / detail ekstra
input bool   Ultra_Fast_Close = true;

//--- Global Variables
CTrade   trade;
datetime LastCheckTime     = 0;
datetime LastHeartbeatTime = 0;
datetime LastStatusLogTime = 0;
datetime LastPollOkTime    = 0;
datetime LastHbOkTime      = 0;
datetime LastPollErrLog    = 0;
datetime LastHbErrLog      = 0;
bool     LastPollOk        = false;
bool     LastHbOk          = false;
string   LastFailHint      = "";

string GlobalVarName    = "";
string PauseVarName     = "";
string TargetVarName    = "";
string CutlossVarName   = "";
string ModeVarName      = "";
string LayerVarName     = "";
string MultVarName      = "";
string EntryModeVarName = "";
string MaxLotVarName    = "";
string BaseLotVarName   = "";
string LayersPerVarName = "";
string LotIncVarName    = "";
string MaxLayerVarName  = "";
string ResetVarName     = "";
string DailyTargetVar   = "";
string DailyLossVar     = "";
string ExpiresVarName   = ""; // unix ts UTC; 0 = no expiry
string TradeTimeVarName = ""; // 0/1 use trading hours
string TradeStartVarName= ""; // minutes from midnight WIB
string TradeEndVarName  = ""; // minutes from midnight WIB

double GetDailyPNL(); // forward decl — dipakai status log di atas

string MaskApiKey()
{
   int n=StringLen(ApiKey);
   if(n<=10) return "****";
   return StringSubstr(ApiKey,0,8)+"…"+StringSubstr(ApiKey,n-4,4);
}

// Satu baris, throttle biar Experts tidak banjir
void LogApiDown(const string tag, datetime &lastLogAt)
{
   datetime now=TimeCurrent();
   if(lastLogAt>0 && now-lastLogAt<15) return;
   lastLogAt=now;
   LastFailHint="API Down";
   Print("[",tag,"] Response - API Down");
}

string EaStatusText()
{
   double eaSt=GlobalVariableCheck(GlobalVarName)?GlobalVariableGet(GlobalVarName):0;
   bool paused=GlobalVariableCheck(PauseVarName)&&GlobalVariableGet(PauseVarName)==1;
   return (eaSt==1)?(paused?"paused":"on"):"off";
}

void UpdateChartComment()
{
   string pollAge=LastPollOkTime>0?IntegerToString((int)(TimeCurrent()-LastPollOkTime))+"s ago":"never";
   string hbAge  =LastHbOkTime>0  ?IntegerToString((int)(TimeCurrent()-LastHbOkTime))+"s ago":"never";
   Comment(
      "SMH Controller\n",
      "Terminal: ",TerminalId,"\n",
      "EA: ",EaStatusText()," | pos=",PositionsTotal(),"\n",
      "Poll: ",(LastPollOk?"OK ":"FAIL "),"",pollAge,"\n",
      "HB: ",(LastHbOk?"OK ":"FAIL "),"",hbAge,
      (!LastPollOk||!LastHbOk)?"\nErr: API Down":""
   );
}

void MaybePrintStatusSummary(bool force=false)
{
   if(StatusLogSeconds<=0 && !force) return;
   datetime now=TimeCurrent();
   if(!force && now-LastStatusLogTime < StatusLogSeconds) return;
   LastStatusLogTime=now;
   Print("[STATUS] EA=",EaStatusText(),
         " pos=",PositionsTotal(),
         " poll=",(LastPollOk?"OK":"FAIL"),
         " hb=",(LastHbOk?"OK":"FAIL"),
         " daily=",DoubleToString(GetDailyPNL(),2));
}

int OnInit()
{
   if(TerminalId == "" || TerminalId == "ISI_TERMINAL_ID")
   { Print("ERROR: TerminalId belum diisi!"); return INIT_FAILED; }
   if(ApiKey == "" || ApiKey == "ISI_API_KEY")
   { Print("ERROR: ApiKey belum diisi!"); return INIT_FAILED; }
   if(ApiBaseUrl == "" || StringFind(ApiBaseUrl,"http")!=0)
   { Print("ERROR: ApiBaseUrl harus http/https!"); return INIT_FAILED; }

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
   BaseLotVarName   = "EA_BASELOT_"   + TerminalId;
   LayersPerVarName = "EA_LAYERSPER_" + TerminalId;
   LotIncVarName    = "EA_LOTINC_"    + TerminalId;
   MaxLayerVarName  = "EA_MAXLAYER_"  + TerminalId;
   ResetVarName     = "EA_RESET_"     + TerminalId;
   DailyTargetVar   = "EA_DAILY_TARGET_"+ TerminalId;
   DailyLossVar     = "EA_DAILY_LOSS_"  + TerminalId;
   ExpiresVarName   = "EA_EXPIRES_"   + TerminalId;
   TradeTimeVarName = "EA_TRADETIME_" + TerminalId;
   TradeStartVarName= "EA_TRADE_START_"+ TerminalId;
   TradeEndVarName  = "EA_TRADE_END_" + TerminalId;

   if(!GlobalVariableCheck(GlobalVarName)) GlobalVariableSet(GlobalVarName, 0);
   if(!GlobalVariableCheck(PauseVarName))  GlobalVariableSet(PauseVarName, 0);
   if(!GlobalVariableCheck(ExpiresVarName)) GlobalVariableSet(ExpiresVarName, 0);
   if(!GlobalVariableCheck(TradeTimeVarName)) GlobalVariableSet(TradeTimeVarName, 1);
   if(!GlobalVariableCheck(TradeStartVarName)) GlobalVariableSet(TradeStartVarName, 7*60);   // 07:00 WIB
   if(!GlobalVariableCheck(TradeEndVarName))   GlobalVariableSet(TradeEndVarName, 17*60);   // 17:00 WIB

   Print("===========================================");
   Print("Web Controller v1.1");
   Print("API       : ", ApiBaseUrl);
   Print("Terminal  : ", TerminalId);
   Print("ApiKey    : ", MaskApiKey());
   Print("Poll      : ", CheckInterval, "s | Heartbeat: ", HeartbeatSeconds, "s");
   Print("StatusLog : ", StatusLogSeconds, "s | Verbose: ", VerboseLog?"ON":"OFF");
   Print("EA Status : ", EaStatusText());
   Print("TradeHrs  : /tradetime /tradestart /tradeend (WIB)");
   Print("Allow URL : Tools → Options → EA → Allow WebRequest for: ", ApiBaseUrl);
   Print("===========================================");

   EventSetTimer(1);
   UpdateChartComment();
   Print("EA READY - Polling web dashboard...");
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   EventKillTimer();
   Comment("");
   Print("Web Controller v1.1 Stopped reason=",reason);
}

void OnTimer()
{
   datetime now=TimeCurrent();
   if(now - LastCheckTime >= CheckInterval)
   {
      PollCommands();
      LastCheckTime = now;
   }
   if(HeartbeatSeconds > 0 && now - LastHeartbeatTime >= HeartbeatSeconds)
   {
      PushHeartbeat();
      LastHeartbeatTime = now;
   }
   MaybePrintStatusSummary();
   UpdateChartComment();
}

string BuildUrl(string path)
{
   string base=ApiBaseUrl;
   while(StringLen(base)>0 && StringGetCharacter(base,StringLen(base)-1)=='/')
      base=StringSubstr(base,0,StringLen(base)-1);
   if(StringLen(path)>0 && StringGetCharacter(path,0)!='/') path="/"+path;
   return base+path;
}

string AuthHeader()
{
   return "Authorization: Bearer "+ApiKey+"\r\nContent-Type: application/json\r\n";
}

bool JsonOk(const string &body)
{
   return (StringFind(body,"\"ok\":true")>=0 || StringFind(body,"\"ok\": true")>=0);
}

string JsonExtractString(const string &obj, const string key)
{
   string needle="\""+key+"\":\"";
   int p=StringFind(obj,needle);
   if(p<0) return "";
   int s=p+StringLen(needle);
   int e=s;
   while(e<StringLen(obj))
   {
      ushort c=StringGetCharacter(obj,e);
      if(c=='\\' && e+1<StringLen(obj)) { e+=2; continue; }
      if(c=='"') break;
      e++;
   }
   if(e<=s) return "";
   return StringSubstr(obj,s,e-s);
}

string JsonExtractRaw(const string &obj, const string key)
{
   string needle="\""+key+"\":";
   int p=StringFind(obj,needle);
   if(p<0) return "";
   int s=p+StringLen(needle);
   while(s<StringLen(obj) && (StringGetCharacter(obj,s)==' '||StringGetCharacter(obj,s)=='\t')) s++;
   if(s>=StringLen(obj)) return "";
   if(StringGetCharacter(obj,s)=='"') return JsonExtractString(obj,key);
   int e=s;
   while(e<StringLen(obj))
   {
      ushort c=StringGetCharacter(obj,e);
      if(c==','||c=='}'||c==']'||c==' '||c=='\n'||c=='\r') break;
      e++;
   }
   string v=StringSubstr(obj,s,e-s);
   StringTrimLeft(v); StringTrimRight(v);
   return v;
}

void JsonEscape(string &s)
{
   StringReplace(s,"\\","\\\\");
   StringReplace(s,"\"","\\\"");
   StringReplace(s,"\n","\\n");
   StringReplace(s,"\r","");
}

void PollCommands()
{
   string url=BuildUrl("/api/v1/terminals/"+TerminalId+"/commands");
   char post[], result[];
   string resultHeaders;
   ResetLastError();
   int res=WebRequest("GET", url, AuthHeader(), 5000, post, result, resultHeaders);
   if(res==-1)
   {
      LastPollOk=false;
      LogApiDown("POLL ERR", LastPollErrLog);
      return;
   }
   string body=CharArrayToString(result,0,WHOLE_ARRAY,CP_UTF8);
   if(!JsonOk(body))
   {
      LastPollOk=false;
      LogApiDown("POLL ERR", LastPollErrLog);
      return;
   }

   LastPollOk=true;
   LastPollOkTime=TimeCurrent();
   LastFailHint="";
   LastPollErrLog=0;

   int arrPos=StringFind(body,"\"commands\"");
   if(arrPos<0)
   {
      if(VerboseLog) Print("[POLL] OK HTTP=",res," (no commands field)");
      return;
   }
   int lb=StringFind(body,"[",arrPos);
   int rb=StringFind(body,"]",lb);
   if(lb<0||rb<0||rb<=lb)
   {
      if(VerboseLog) Print("[POLL] OK HTTP=",res," queue empty");
      return;
   }
   string arr=StringSubstr(body,lb+1,rb-lb-1);

   int search=0, processed=0;
   while(true)
   {
      int oStart=StringFind(arr,"{",search);
      if(oStart<0) break;
      int oEnd=StringFind(arr,"}",oStart);
      if(oEnd<0) break;
      string obj=StringSubstr(arr,oStart,oEnd-oStart+1);
      string id=JsonExtractString(obj,"id");
      if(id=="") id=JsonExtractRaw(obj,"id");
      string text=JsonExtractString(obj,"text");
      if(text=="")
      {
         string cmd=JsonExtractString(obj,"cmd");
         if(cmd=="") cmd=JsonExtractRaw(obj,"cmd");
         string val=JsonExtractRaw(obj,"value");
         if(cmd!="")
         {
            if(StringGetCharacter(cmd,0)!='/') cmd="/"+cmd;
            text=(val!="") ? (cmd+" "+val) : cmd;
         }
      }
      if(text!="")
      {
         Print("[EXEC] id=",id," text=",text);
         string resultMsg="";
         bool ok=ProcessCommand(text, resultMsg);
         Print("[EXEC] id=",id," ok=",ok," msg=",resultMsg);
         AckCommand(id, ok, resultMsg);
         processed++;
      }
      search=oEnd+1;
   }
   if(processed>0) Print("[POLL] diproses ", processed, " command");
   else if(VerboseLog) Print("[POLL] OK HTTP=",res," queue empty");
}

void AckCommand(const string id, bool ok, string message)
{
   if(id=="") return;
   JsonEscape(message);
   string url=BuildUrl("/api/v1/terminals/"+TerminalId+"/commands/"+id+"/ack");
   string payload="{\"ok\":"+(ok?"true":"false")+",\"message\":\""+message+"\"}";
   char post[], result[];
   StringToCharArray(payload, post, 0, WHOLE_ARRAY);
   ArrayResize(post, ArraySize(post)-1);
   string resultHeaders;
   ResetLastError();
   int res=WebRequest("POST", url, AuthHeader(), 5000, post, result, resultHeaders);
   if(res==-1)
   {
      Print("[ACK ERR] Response - API Down");
      return;
   }
   string body=CharArrayToString(result,0,WHOLE_ARRAY,CP_UTF8);
   if(!JsonOk(body))
      Print("[ACK ERR] Response - API Down");
   else if(VerboseLog)
      Print("[ACK] id=",id," OK");
}

void PushHeartbeat()
{
   double eaSt=GlobalVariableCheck(GlobalVarName)?GlobalVariableGet(GlobalVarName):0;
   bool paused=GlobalVariableCheck(PauseVarName)&&GlobalVariableGet(PauseVarName)==1;
   string status=(eaSt==1)?(paused?"paused":"on"):"off";

   int totalPos=PositionsTotal(), buyPos=0, sellPos=0;
   double floatPnL=0;
   for(int i=0;i<totalPos;i++)
      if(PositionGetTicket(i)>0)
      {
         long t=PositionGetInteger(POSITION_TYPE);
         floatPnL+=PositionGetDouble(POSITION_PROFIT)+PositionGetDouble(POSITION_SWAP)+PositionGetDouble(POSITION_COMMISSION);
         if(t==POSITION_TYPE_BUY) buyPos++;
         else if(t==POSITION_TYPE_SELL) sellPos++;
      }

   double layer=GlobalVariableCheck(LayerVarName)?GlobalVariableGet(LayerVarName):0;
   double mult=GlobalVariableCheck(MultVarName)?GlobalVariableGet(MultVarName):0;
   double target=GlobalVariableCheck(TargetVarName)?GlobalVariableGet(TargetVarName):0;
   double cut=GlobalVariableCheck(CutlossVarName)?GlobalVariableGet(CutlossVarName):0;
   int mode=GlobalVariableCheck(ModeVarName)?(int)GlobalVariableGet(ModeVarName):0;
   int entry=GlobalVariableCheck(EntryModeVarName)?(int)GlobalVariableGet(EntryModeVarName):0;
   double maxLot=GlobalVariableCheck(MaxLotVarName)?GlobalVariableGet(MaxLotVarName):0;
   double baseLot=GlobalVariableCheck(BaseLotVarName)?GlobalVariableGet(BaseLotVarName):0;
   int layersPer=GlobalVariableCheck(LayersPerVarName)?(int)GlobalVariableGet(LayersPerVarName):0;
   double lotInc=GlobalVariableCheck(LotIncVarName)?GlobalVariableGet(LotIncVarName):0;
   int maxLayer=GlobalVariableCheck(MaxLayerVarName)?(int)GlobalVariableGet(MaxLayerVarName):0;
   int tradeTime=GlobalVariableCheck(TradeTimeVarName)?(int)GlobalVariableGet(TradeTimeVarName):1;
   int tradeStart=GlobalVariableCheck(TradeStartVarName)?(int)GlobalVariableGet(TradeStartVarName):7*60;
   int tradeEnd=GlobalVariableCheck(TradeEndVarName)?(int)GlobalVariableGet(TradeEndVarName):17*60;
   double daily=GetDailyPNL();

   string payload="{";
   payload+="\"status\":\""+status+"\",";
   payload+="\"account\":"+IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN))+",";
   payload+="\"symbol\":\""+_Symbol+"\",";
   payload+="\"balance\":"+DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE),2)+",";
   payload+="\"equity\":"+DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY),2)+",";
   payload+="\"positions\":"+IntegerToString(totalPos)+",";
   payload+="\"buy\":"+IntegerToString(buyPos)+",";
   payload+="\"sell\":"+IntegerToString(sellPos)+",";
   payload+="\"float_pnl\":"+DoubleToString(floatPnL,2)+",";
   payload+="\"daily_pnl\":"+DoubleToString(daily,2)+",";
   payload+="\"layer\":"+DoubleToString(layer,1)+",";
   payload+="\"multiplier\":"+DoubleToString(mult,2)+",";
   payload+="\"target\":"+DoubleToString(target,2)+",";
   payload+="\"cutloss\":"+DoubleToString(cut,2)+",";
   payload+="\"mode\":"+IntegerToString(mode)+",";
   payload+="\"entry_mode\":"+IntegerToString(entry)+",";
   payload+="\"max_lot\":"+DoubleToString(maxLot,2)+",";
   payload+="\"base_lot\":"+DoubleToString(baseLot,2)+",";
   payload+="\"layers_per_lot\":"+IntegerToString(layersPer)+",";
   payload+="\"lot_increment\":"+DoubleToString(lotInc,2)+",";
   payload+="\"max_layer\":"+IntegerToString(maxLayer)+",";
   payload+="\"trade_time\":"+IntegerToString(tradeTime)+",";
   payload+="\"trade_start\":"+IntegerToString(tradeStart)+",";
   payload+="\"trade_end\":"+IntegerToString(tradeEnd);
   payload+="}";

   string url=BuildUrl("/api/v1/terminals/"+TerminalId+"/heartbeat");
   char post[], result[];
   StringToCharArray(payload, post, 0, WHOLE_ARRAY);
   ArrayResize(post, ArraySize(post)-1);
   string resultHeaders;
   ResetLastError();
   int res=WebRequest("POST", url, AuthHeader(), 5000, post, result, resultHeaders);
   if(res==-1)
   {
      LastHbOk=false;
      LogApiDown("HB ERR", LastHbErrLog);
      return;
   }
   string body=CharArrayToString(result,0,WHOLE_ARRAY,CP_UTF8);
   if(!JsonOk(body))
   {
      LastHbOk=false;
      LogApiDown("HB ERR", LastHbErrLog);
      return;
   }

   LastHbOk=true;
   LastHbOkTime=TimeCurrent();
   LastHbErrLog=0;
   if(LastPollOk) LastFailHint="";

   // Sync licence expiry from dashboard → GV (unix UTC; 0 = none)
   string tsRaw=JsonExtractRaw(body,"expires_ts");
   if(tsRaw!="")
   {
      double ts=StringToDouble(tsRaw);
      if(ts<0) ts=0;
      double prev=GlobalVariableCheck(ExpiresVarName)?GlobalVariableGet(ExpiresVarName):0;
      if(prev!=ts)
      {
         GlobalVariableSet(ExpiresVarName,ts);
         if(ts<=0) Print("[LICENCE] No expiry");
         else Print("[LICENCE] Expires ",TimeToString((datetime)ts,TIME_DATE|TIME_MINUTES)," UTC (ts=",DoubleToString(ts,0),")");
      }
      else GlobalVariableSet(ExpiresVarName,ts);
   }

   if(VerboseLog)
      Print("[HB] OK status=",status," pos=",totalPos,
            " float=",DoubleToString(floatPnL,2),
            " daily=",DoubleToString(daily,2));
}

bool IsLicenceExpired()
{
   if(!GlobalVariableCheck(ExpiresVarName)) return false;
   double ts=GlobalVariableGet(ExpiresVarName);
   if(ts<=0) return false;
   return TimeGMT() > (datetime)ts;
}

bool CheckEAStatus(string &message)
{
   if(IsLicenceExpired())
   { message="EA TIDAK BISA ON — licence expired. Hubungi admin."; return false; }
   bool targetReached = GlobalVariableCheck(DailyTargetVar) && GlobalVariableGet(DailyTargetVar)==1;
   bool lossHit       = GlobalVariableCheck(DailyLossVar)   && GlobalVariableGet(DailyLossVar)==1;
   if(targetReached){ message="EA TIDAK BISA ON — target harian tercapai. Kirim /reset dulu."; return false; }
   if(lossHit)      { message="EA TIDAK BISA ON — daily loss hit. Kirim /reset dulu."; return false; }
   return true;
}

int CloseAllPositions(double &totalPNL)
{
   int totalClosed=0; totalPNL=0.0; int total=PositionsTotal(); if(!total) return 0;
   ulong tickets[]; int tc=0;
   for(int i=total-1;i>=0;i--)
   {
      ulong t=PositionGetTicket(i);
      if(t>0)
      {
         totalPNL+=PositionGetDouble(POSITION_PROFIT)+PositionGetDouble(POSITION_SWAP)+PositionGetDouble(POSITION_COMMISSION);
         ArrayResize(tickets,tc+1); tickets[tc]=t; tc++;
      }
   }
   if(!tc) return 0;
   if(Ultra_Fast_Close) trade.SetAsyncMode(true);
   for(int i=0;i<tc;i++)
   {
      if(trade.PositionClose(tickets[i])) totalClosed++;
      else Print("[CLOSE FAIL] ticket=",tickets[i]," retcode=",trade.ResultRetcode()," ",trade.ResultRetcodeDescription());
   }
   if(Ultra_Fast_Close) trade.SetAsyncMode(false);
   Sleep(100);
   int rem=PositionsTotal();
   for(int retry=0;retry<3&&rem>0;retry++)
   {
      Sleep(200);
      if(Ultra_Fast_Close) trade.SetAsyncMode(true);
      for(int i=PositionsTotal()-1;i>=0;i--)
      {
         ulong t=PositionGetTicket(i);
         if(t>0 && trade.PositionClose(t)) totalClosed++;
      }
      if(Ultra_Fast_Close) trade.SetAsyncMode(false);
      Sleep(100);
      rem=PositionsTotal();
      if(!rem) break;
   }
   Print("[CLOSE] closed=",totalClosed," remain=",PositionsTotal()," pnl=",DoubleToString(totalPNL,2));
   return totalClosed;
}

bool ParseTimeToMinutes(string raw, int &outMin)
{
   StringTrimLeft(raw); StringTrimRight(raw);
   if(raw=="") return false;

   int h=-1, m=0;
   int colon=StringFind(raw,":");
   if(colon>=0)
   {
      h=(int)StringToInteger(StringSubstr(raw,0,colon));
      m=(int)StringToInteger(StringSubstr(raw,colon+1));
   }
   else
   {
      int sp=StringFind(raw," ");
      if(sp>=0)
      {
         h=(int)StringToInteger(StringSubstr(raw,0,sp));
         m=(int)StringToInteger(StringSubstr(raw,sp+1));
      }
      else
      {
         // HHMM e.g. 700 / 1700
         int v=(int)StringToInteger(raw);
         if(v>=0 && v<=2359){ h=v/100; m=v%100; }
      }
   }
   if(h<0||h>23||m<0||m>59) return false;
   outMin=h*60+m;
   return true;
}

string FormatMinutesWib(int mins)
{
   if(mins<0) mins=0;
   if(mins>=24*60) mins=mins%(24*60);
   int h=mins/60, m=mins%60;
   return StringFormat("%02d:%02d",h,m);
}

/** Match "/cmd" or "/cmd ..." (name without leading slash). */
bool CmdStartsWith(const string command, const string name)
{
   string withSlash="/"+name;
   if(command==withSlash || command==name) return true;
   if(StringFind(command,withSlash+" ")==0) return true;
   if(StringFind(command,name+" ")==0) return true;
   return false;
}

string CmdArg(const string command)
{
   int sp=StringFind(command," ");
   if(sp<0) return "";
   string ns=StringSubstr(command,sp+1);
   StringTrimLeft(ns); StringTrimRight(ns);
   return ns;
}

bool ProcessCommand(string command, string &outMsg)
{
   StringToLower(command); StringTrimLeft(command); StringTrimRight(command);
   outMsg="";

   if(command=="/on"||command=="on")
   {
      if(!CheckEAStatus(outMsg)) return false;
      bool wasPaused=GlobalVariableCheck(PauseVarName)&&GlobalVariableGet(PauseVarName)==1;
      GlobalVariableSet(GlobalVarName,1); GlobalVariableSet(PauseVarName,0);
      outMsg=wasPaused?"RESUMED from pause":"EA ON";
      Print("[CMD] EA STATUS: ON",wasPaused?" (resume)":"");
      return true;
   }
   if(command=="/off"||command=="off")
   {
      int tb=PositionsTotal();
      GlobalVariableSet(GlobalVarName,0); GlobalVariableSet(PauseVarName,0);
      double pnl=0; if(tb>0) CloseAllPositions(pnl);
      outMsg="EA OFF"+(tb>0?" + closed positions":"");
      Print("[CMD] EA STATUS: OFF");
      return true;
   }
   if(command=="/pause"||command=="pause")
   {
      double eaSt=GlobalVariableCheck(GlobalVarName)?GlobalVariableGet(GlobalVarName):0;
      if(eaSt!=1){ outMsg="EA OFF — pause butuh ON dulu"; return false; }
      if(GlobalVariableCheck(PauseVarName)&&GlobalVariableGet(PauseVarName)==1)
      { outMsg="Sudah PAUSED"; return true; }
      GlobalVariableSet(PauseVarName,1);
      outMsg="PAUSED — entry blocked, TP tetap jalan";
      Print("[CMD] EA PAUSED");
      return true;
   }
   if(CmdStartsWith(command,"settarget"))
   {
      string ns=CmdArg(command);
      if(ns==""){ double c=GlobalVariableCheck(TargetVarName)?GlobalVariableGet(TargetVarName):0; outMsg="target="+DoubleToString(c,0); return true; }
      double v=StringToDouble(ns); if(v<0)v=0;
      GlobalVariableSet(TargetVarName,v);
      outMsg="target set "+DoubleToString(v,0);
      Print("[CMD] TARGET=",DoubleToString(v,0));
      return true;
   }
   if(CmdStartsWith(command,"setcutloss"))
   {
      string ns=CmdArg(command);
      if(ns==""){ double c=GlobalVariableCheck(CutlossVarName)?GlobalVariableGet(CutlossVarName):0; outMsg="cutloss="+DoubleToString(c,0); return true; }
      double v=StringToDouble(ns); if(v<0)v=0;
      GlobalVariableSet(CutlossVarName,v);
      outMsg="cutloss set "+DoubleToString(v,0);
      Print("[CMD] CUTLOSS=",DoubleToString(v,0));
      return true;
   }
   if(CmdStartsWith(command,"setlayer"))
   {
      string ns=CmdArg(command);
      if(ns==""){ double c=GlobalVariableCheck(LayerVarName)?GlobalVariableGet(LayerVarName):500; outMsg="layer="+DoubleToString(c,0); return true; }
      double v=StringToDouble(ns); if(v<10){ outMsg="min 10 pts"; return false; }
      GlobalVariableSet(LayerVarName,v);
      outMsg="layer set "+DoubleToString(v,0);
      Print("[CMD] LAYER=",DoubleToString(v,0)," pts");
      return true;
   }
   if(CmdStartsWith(command,"setmultiplier"))
   {
      string ns=CmdArg(command);
      if(ns==""){ double c=GlobalVariableCheck(MultVarName)?GlobalVariableGet(MultVarName):1.3; outMsg="mult="+DoubleToString(c,2); return true; }
      double v=StringToDouble(ns); if(v<0.1){ outMsg="min 0.1"; return false; } if(v>10){ outMsg="max 10"; return false; }
      GlobalVariableSet(MultVarName,v);
      outMsg="multiplier set "+DoubleToString(v,2);
      Print("[CMD] MULT=x",DoubleToString(v,2));
      return true;
   }
   if(CmdStartsWith(command,"maxlot"))
   {
      string ns=CmdArg(command);
      if(ns==""){ double c=GlobalVariableCheck(MaxLotVarName)?GlobalVariableGet(MaxLotVarName):0; outMsg="maxlot="+DoubleToString(c,2); return true; }
      double v=StringToDouble(ns); if(v<0)v=0;
      GlobalVariableSet(MaxLotVarName,v);
      outMsg="maxlot set "+DoubleToString(v,2);
      Print("[CMD] MAXLOT=",DoubleToString(v,2));
      return true;
   }
   if(CmdStartsWith(command,"setbaselot"))
   {
      string ns=CmdArg(command);
      if(ns==""){ double c=GlobalVariableCheck(BaseLotVarName)?GlobalVariableGet(BaseLotVarName):0.01; outMsg="baselot="+DoubleToString(c,2); return true; }
      double v=StringToDouble(ns); if(v<=0){ outMsg="baselot min > 0"; return false; }
      GlobalVariableSet(BaseLotVarName,v);
      outMsg="baselot set "+DoubleToString(v,2);
      Print("[CMD] BASELOT=",DoubleToString(v,2));
      return true;
   }
   if(CmdStartsWith(command,"setlayersper"))
   {
      string ns=CmdArg(command);
      if(ns==""){ int c=(int)(GlobalVariableCheck(LayersPerVarName)?GlobalVariableGet(LayersPerVarName):3); outMsg="layersper="+IntegerToString(c); return true; }
      int v=(int)StringToDouble(ns); if(v<1){ outMsg="layersper min 1"; return false; }
      GlobalVariableSet(LayersPerVarName,(double)v);
      outMsg="layersper set "+IntegerToString(v);
      Print("[CMD] LAYERSPER=",IntegerToString(v));
      return true;
   }
   if(CmdStartsWith(command,"setlotinc"))
   {
      string ns=CmdArg(command);
      if(ns==""){ double c=GlobalVariableCheck(LotIncVarName)?GlobalVariableGet(LotIncVarName):0.01; outMsg="lotinc="+DoubleToString(c,2); return true; }
      double v=StringToDouble(ns); if(v<=0){ outMsg="lotinc min > 0"; return false; }
      GlobalVariableSet(LotIncVarName,v);
      outMsg="lotinc set "+DoubleToString(v,2);
      Print("[CMD] LOTINC=",DoubleToString(v,2));
      return true;
   }
   if(CmdStartsWith(command,"maxlayer"))
   {
      string ns=CmdArg(command);
      if(ns==""){ int c=(int)(GlobalVariableCheck(MaxLayerVarName)?GlobalVariableGet(MaxLayerVarName):0); outMsg="maxlayer="+IntegerToString(c); return true; }
      int v=(int)StringToDouble(ns); if(v<0)v=0;
      GlobalVariableSet(MaxLayerVarName,(double)v);
      outMsg="maxlayer set "+IntegerToString(v);
      Print("[CMD] MAXLAYER=",IntegerToString(v));
      return true;
   }
   if(CmdStartsWith(command,"tradetime"))
   {
      string ns=CmdArg(command);
      if(ns=="")
      {
         int c=(int)(GlobalVariableCheck(TradeTimeVarName)?GlobalVariableGet(TradeTimeVarName):1);
         outMsg="tradetime="+(c==1?"on":"off");
         return true;
      }
      int v=-1;
      if(ns=="1"||ns=="on"||ns=="true"||ns=="yes") v=1;
      else if(ns=="0"||ns=="off"||ns=="false"||ns=="no") v=0;
      if(v<0){ outMsg="tradetime butuh on/off atau 1/0"; return false; }
      GlobalVariableSet(TradeTimeVarName,(double)v);
      outMsg="tradetime "+(v==1?"ON":"OFF");
      Print("[CMD] TRADETIME=",v==1?"ON":"OFF");
      return true;
   }
   if(CmdStartsWith(command,"tradestart"))
   {
      string ns=CmdArg(command);
      if(ns=="")
      {
         int c=(int)(GlobalVariableCheck(TradeStartVarName)?GlobalVariableGet(TradeStartVarName):7*60);
         outMsg="tradestart="+FormatMinutesWib(c);
         return true;
      }
      int mins=0;
      if(!ParseTimeToMinutes(ns,mins)){ outMsg="format jam salah (contoh 7:00 atau 7 0)"; return false; }
      GlobalVariableSet(TradeStartVarName,(double)mins);
      outMsg="tradestart set "+FormatMinutesWib(mins);
      Print("[CMD] TRADESTART=",FormatMinutesWib(mins));
      return true;
   }
   if(CmdStartsWith(command,"tradeend"))
   {
      string ns=CmdArg(command);
      if(ns=="")
      {
         int c=(int)(GlobalVariableCheck(TradeEndVarName)?GlobalVariableGet(TradeEndVarName):17*60);
         outMsg="tradeend="+FormatMinutesWib(c);
         return true;
      }
      int mins=0;
      if(!ParseTimeToMinutes(ns,mins)){ outMsg="format jam salah (contoh 17:00 atau 17 0)"; return false; }
      GlobalVariableSet(TradeEndVarName,(double)mins);
      outMsg="tradeend set "+FormatMinutesWib(mins);
      Print("[CMD] TRADEEND=",FormatMinutesWib(mins));
      return true;
   }
   if(command=="/conservative"||command=="conservative")
   { GlobalVariableSet(ModeVarName,0); outMsg="mode CONSERVATIVE"; Print("[CMD] MODE=CONSERVATIVE"); return true; }
   if(command=="/aggressive"||command=="aggressive")
   { GlobalVariableSet(ModeVarName,1); outMsg="mode AGGRESSIVE"; Print("[CMD] MODE=AGGRESSIVE"); return true; }
   if(command=="/oneway"||command=="oneway")
   { GlobalVariableSet(EntryModeVarName,1); outMsg="entry ONE_WAY"; Print("[CMD] ENTRY=ONE_WAY"); return true; }
   if(command=="/twoway"||command=="twoway")
   { GlobalVariableSet(EntryModeVarName,0); outMsg="entry TWO_WAY"; Print("[CMD] ENTRY=TWO_WAY"); return true; }
   if(command=="/reset"||command=="reset")
   { GlobalVariableSet(ResetVarName,1); outMsg="reset queued"; Print("[CMD] RESET queued"); return true; }
   if(command=="/status"||command=="status")
   {
      double eaSt=GlobalVariableCheck(GlobalVarName)?GlobalVariableGet(GlobalVarName):0;
      bool isPaused=GlobalVariableCheck(PauseVarName)&&GlobalVariableGet(PauseVarName)==1;
      outMsg="status="+(eaSt==1?(isPaused?"paused":"on"):"off")
            +" pos="+IntegerToString(PositionsTotal())
            +" daily="+DoubleToString(GetDailyPNL(),2);
      Print("[CMD] STATUS ",outMsg);
      return true;
   }

   outMsg="unknown command: "+command;
   Print("[CMD] UNKNOWN: ",command," (need Controller v1.17+ for setlotinc)");
   return false;
}

double GetDailyPNL()
{
   datetime sod=StringToTime(TimeToString(TimeCurrent(),TIME_DATE));
   HistorySelect(sod,TimeCurrent());
   double profit=0;
   int total=HistoryDealsTotal();
   for(int i=0;i<total;i++)
   {
      ulong t=HistoryDealGetTicket(i);
      if(t>0)
      {
         long e=HistoryDealGetInteger(t,DEAL_ENTRY);
         if(e==DEAL_ENTRY_OUT||e==DEAL_ENTRY_INOUT)
            profit+=HistoryDealGetDouble(t,DEAL_PROFIT)+HistoryDealGetDouble(t,DEAL_COMMISSION)+HistoryDealGetDouble(t,DEAL_SWAP);
      }
   }
   return profit;
}

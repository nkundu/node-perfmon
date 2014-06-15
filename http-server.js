var util = require('util');

var journey = require('journey');

var Utils = require('util');
var Wmi = require('wmi');

var stats = { processor: 0, memfree: 0, totmem: 0, network: {}, proc: {} };

Wmi.connect(function(err, wmi) {
  setInterval(function () {
      wmi.query("SELECT PercentProcessorTime FROM Win32_PerfFormattedData_Counters_ProcessorInformation WHERE Name ='_Total'", function(err, results) { 
          stats['processor'] = results[0].PercentProcessorTime;
      });
      
  }, 1000);
  setInterval(function () {
      wmi.query("SELECT FreePhysicalMemory,TotalVisibleMemorySize FROM Win32_OperatingSystem", function(err, results) { 
          stats['memfree'] = results[0].FreePhysicalMemory;
          stats['totmem'] = results[0].TotalVisibleMemorySize;
      });
      wmi.query("SELECT Name,BytesReceivedPersec,BytesSentPerSec,PacketsPerSec FROM Win32_PerfRawData_Tcpip_NetworkInterface", function(err, results) {
          stats['network'] = results[0];
      });
      wmi.query("SELECT Caption,ThreadCount,HandleCount,PrivateBytes,WorkingSet,PercentProcessorTime,PageFaultsPerSec,Timestamp_Sys100NS,IDProcess FROM Win32_PerfRawData_PerfProc_Process", function(err, results) {
          stats['proc'] = results;
      });
      
  }, 5000);
});

//
// Create a Router object with an associated routing table
//
var router = new(journey.Router);

router.map(function () {
    this.root.bind(function (req, res) { // GET '/'
        res.send(200, {}, req);
    });
    this.get('/version').bind(function (req, res) {
        res.send(200, {}, { version: journey.version.join('.') });
    });
    
    // for more, see http://kb.paessler.com/en/topic/8783-which-wql-queries-are-used-by-prtg-s-wmi-sensors
    this.get('/stats').bind(function (req, res) {
      
      res.send(200, {}, stats);
      
    });
    
});

require('http').createServer(function (request, response) {
    var body = "";

    request.addListener('data', function (chunk) { body += chunk });
    request.addListener('end', function () {
        //
        // Dispatch the request to the router
        //
        router.handle(request, body, function (result) {
        
        
            result.headers['Access-Control-Allow-Origin'] = '*';
            result.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE';
            result.headers['Access-Control-Allow-Headers'] = 'Content-Type';
    
            response.writeHead(result.status, result.headers);
            response.end(result.body);
        });
    });
}).listen(8080);

util.puts('journey listening at http://127.0.0.1:8080');

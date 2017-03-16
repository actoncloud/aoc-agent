// Copyright 2016-17 ActOnMagic
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var fs = require('fs');
var os = require('os');
var request = require('request');

var express = require('express');
var socketio = require('socket.io');
var socketioauth = require('socketio-auth');
var exec = require('child_process').exec;

var aocutil = require('./metrics/util');
var aocpushengine = require('./engine/pushmetrics');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

var agentconf = JSON.parse(fs.readFileSync('./agent.json', 'utf8'));

if (!agentconf['AOC_AGENT_API_KEY']) {
    console.log("Invalid API Key found. contact support@actonmagic.com");
}

var app = express();
var server = null;


if (agentconf.secure) {
    // Replace these Self-signed dummy certificate with Actual Certificate
    var privateKey = fs.readFileSync('myactoncloud.key', 'utf8');
    var certificate = fs.readFileSync('myactoncloud.cert', 'utf8');
    var cacrt = fs.readFileSync('myactoncloud.crt', 'utf8');
    var credentials = {key: privateKey, cert: certificate, ca: cacrt};

    server = require('https').Server(credentials, app);
}
else
    server = require('http').Server(app);


var io = socketio(server);

app.set('version', '1.0');
app.set('port', 5088);

var sysInfo = {
    osType: (os.type().toLowerCase() === 'darwin') ? 'Mac OS X' : os.type(),
    osReleaseVersion: os.release(),
    osArch: os.arch(),
    osCPUs: os.cpus(),
    osHostname: os.hostname(),
    osTotalMemory: Number(os.totalmem() / 1073741824).toFixed(0)
};

var connection = {
    host: sysInfo.osHostname,
    port: 5088
};

if (agentconf['frequency'] != -1) {
    if (agentconf['connector_id'] && agentconf['vm_id'] && agentconf['server_ip']) {
        var con_dr_cron = setInterval(function () {
            aocpushengine.sendAgentDataToServer(agentconf);
        }, agentconf.frequency);
    }
}
else {
    socketioauth(io, {
        authenticate: function (socket, data, callback) {
            //get credentials sent by the client
            var username = data.username;
            var password = data.password;

            if (( agentconf.connector_id && ( agentconf.connector_id.indexOf(username) > -1) ) &&
                ( agentconf.AOC_AGENT_API_KEY && ( agentconf.AOC_AGENT_API_KEY.indexOf(password) != -1) )) {
                return callback(null, true);
            }
            else {
                return callback(new Error("Invalid request."));
            }
        }
    });

    io.on('connection', function (io) {
        io.on('getStats', function (from, client) {
            aocutil.getPerfSample(agentconf.default_nic, function (e, perfData) {
                if (e) {
                    console.log("Error collecting performance data: " + JSON.stringify(e));
                }
                else {
                    client(perfData);
                }
            });
        });
    });

    aocutil.getOSVersion(function (err, osversion) {
        if (err) {
            console.log("Could not find the OS version: " + JSON.stringify(err));
        }

        server.listen(app.get('port'), function () {
            console.log('AoC Agent version:' + app.get('version'));
            console.log('AoC Agent listening on port: ' + app.get('port'));
            console.log("OS Version:" + osversion);
        });
    });
}


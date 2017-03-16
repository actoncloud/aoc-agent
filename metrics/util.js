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
var getos = require('getos');

var exec = require('child_process').exec;

var _self = require('./util');


var osversion = 6;

exports.getOSVersion = function (callback) {
    getos(function (e, os) {
        if (e) {
            return console.log(e);
        }
        var release = os.release;
        if (release) {
            if (release.indexOf('7.') == 0)
                osversion = 7;
            else if (release.indexOf('6.') == 0)
                osversion = 6;
            else
                osversion = 5;
        }
        callback(e, osversion);
    });
}


exports.getDiskUsage = function (callback) {
    try {
        var disk = require('diskusage');

        disk.check('/', function (err, info) {
            var availablePercentage = ((info.available / info.total)).toFixed(2);
            var totalDiskspace = Number(info.total / 1073741824).toFixed(2);
            var freeSpace = Number(info.available / 1073741824).toFixed(2);
            callback(err, {total: totalDiskspace, free: freeSpace, utilization: availablePercentage});
        });
    }
    catch (ex) {
        callback(null, {total: -1, free: -1, utilization: -1});
    }
}

exports.getBandwidth = function (type, eth, version, callback) {
    // Todo: on windows, use ipconfig & multinic
    var net = eth ? eth : "eth0";
    if (version == 7) {
        var cmd = "ifconfig " + net + " | grep '" + type + " packets' | awk '{print $5'}";
    } else {
        var cmd = "ifconfig " + net + " | grep -oP '(?<=" + type + " bytes:)[0-9]*'";
    }
    exec(cmd, function (err, stdout, stderr) {
        if (err) {
            return callback(err);
        } else {
            var str = stdout.substring(0, stdout.length - 1);
            callback(null, str);
        }
    });
}

/**
 *
 * @param eth - index for which bandwidth details need to be collected
 * @param next
 */

exports.getPerfSample = function (eth, next) {

    var load = os.loadavg()[0];
    var totalMemory = Number(os.totalmem() / 1073741824).toFixed(4);
    var freeMemory = Number(os.freemem() / 1073741824).toFixed(4);
    var usedMemory = Number(totalMemory - freeMemory).toFixed(4);
    var cpus = os.cpus();

    var mem_utilization = (usedMemory / totalMemory).toFixed(4);
    var cpu_utilization = 0;

    var rx = 0, tx = 0;
    for (var i = 0, len = cpus.length; i < len; i++) {
        var cpu = cpus[i], total = 0;
        for (var t in cpu.times)
            total += cpu.times[t];
        cpu_utilization += Math.round(100 * ( cpu.times['user'] + cpu.times['sys']) / total);
    }

    cpu_utilization /= cpus.length;
    _self.getBandwidth("RX", eth, osversion, function (e, r) {
        rx = r ? Number(r / 1000000).toFixed(4) : 0;
        _self.getBandwidth("TX", eth, osversion, function (e, t) {
            tx = t ? Number(t / 1000000).toFixed(4) : 0;
            _self.getDiskUsage(function (e, d) {
                tx = t ? Number(t / 1000000).toFixed(4) : 0;
                next(null, {
                    network: eth, loadavg: load, cpu_utilization: cpu_utilization, no_cpus: cpus.length,
                    mem_utilization: mem_utilization, mem_total: totalMemory, mem_free: freeMemory,
                    nrx_mb: rx, ntx_mb: tx, disk_utilization: d.utilization, disk_total: d.total, disk_free: d.free
                });
            });
        });
    });
}

function sendAgentDataToServer(agentconf) {
    _self.getPerfSample(agentconf.default_nic, function (e, perfData) {
        perfData['uuid'] = agentconf.vm_id;
        perfData['connector_id'] = agentconf.connector_id;
        perfData['apikey'] = agentconf.AOC_AGENT_API_KEY;
        perfData['version'] = agentconf.version;

        request.post(
            "https://" + agentconf.server_ip + '/api/agent',
            {form: perfData},
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body)
                } else {
                    console.log("Error: " + error);
                }
            }
        );
    });

}

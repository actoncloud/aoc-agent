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

var aocutil = require('../metrics/util');
var request = require('request');

exports.sendAgentDataToServer = function (agentconf) {
    if (agentconf) {
        aocutil.getPerfSample(agentconf.default_nic, function (e, perfData) {
            perfData['uuid'] = agentconf.vm_id;
            perfData['connector_id'] = agentconf.connector_id;
            perfData['apikey'] = agentconf.AOC_AGENT_API_KEY;
            perfData['version'] = agentconf.version;

            request.post(
                "https://" + agentconf.server_ip + '/api/agent',
                {
                    form: perfData
                },
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
}
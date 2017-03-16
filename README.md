# aoc-agent

ActOnCloud Agents providers extended performance monitoring. ActOnCloud uses cloud provider’s native interfaces to track server resource usage over time. However not all cloud providers offer an interface to source the resource usage details. There are external tools available to collect additional resource usage metrics like Bandwidth usage, Memory usage, Disk usage.

ActOnCloud Agent can be installed on VM/Droplets to provide metrics for memory and disk utilization. ActOnCloud cloud uses these metrics as reliable sources to offer Autoscaling, Server Alerts and Monitoring and Self-Healing Infrastructure.

[Read ActOnCloud Agent Blog](http://www.actoncloud.com/blog/how-to-install-and-use-the-actoncloud-agent/)

## Installation
```
npm install --save aoc-agent
```

## Configuration

Agent configuration is stored in agent.json file:
{
   “AOC_AGENT_API_KEY”: // This is the API token, that you obtain from ActOnCloud Server,
   “server_ip”: //This is the actoncloud server URL,
   “connector_id”: // This is another unique id represents your connector,
   “vm_id”: // Guest UUId,
   “version”: //Agent version,
   “frequency”: // in seconds, -1 means “Normal Mode”. > 0 means “Firewall mode”, indicates how frequently should agend send data to server,
   “secure”: false //Use https or http
}

## Usage

node aocagent.js

```

## Tests

In progress.

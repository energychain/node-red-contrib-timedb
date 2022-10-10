module.exports = function(RED) {
  function TimeDBConfigNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;

    node.config = {
      key: node.credentials.key
    };
  }


    function TimeDBWriteNode(config) {
        RED.nodes.createNode(this,config);
        const axios = require("axios");
        var node = this;
        node.on('input', async function(msg) {
          let rapidapiconfig = RED.nodes.getNode(config.account);
          let data = {};
          data.measurement = config.measurement;
          let tags = {};
          let fields = {};
          for (const [key, value] of Object.entries(msg.payload)) {
            if((typeof value !== 'undefined') && (value !== null)) {
              if(isNaN(value)) {
                tags[key] = value;
              } else {
                fields[key] = value;
              }
            }

          }
          data.points = [{
            tags:tags,
            fields:fields
          }];

          if(rapidapiconfig !== null) {
            let options = {
                method: 'POST',
                url: 'https://timedb.p.rapidapi.com/writeMeasurement',
                headers: {
                  'content-type': 'application/json',
                  'x-rapidapi-host': 'timedb.p.rapidapi.com',
                  'x-rapidapi-key': rapidapiconfig.config.key
                },
                data: data
            };
            axios.request(options).then(function (response) {
                msg.payload = response.data;
                node.send(msg)
              }).catch(function (error) {
              	console.error(error);
            });
           }
        });

    }
    RED.nodes.registerType("TimeDBWrite",TimeDBWriteNode,{
     credentials: {
         account: {type:"timedb-config"}
     }
   });
   RED.nodes.registerType("timedb-config", TimeDBConfigNode, {
       credentials: {
           key: {type:"text"}
       }
     });
}

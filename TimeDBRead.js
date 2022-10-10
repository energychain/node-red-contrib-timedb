module.exports = function(RED) {
    function TimeDBConfigNode(n) {
      RED.nodes.createNode(this, n);
      var node = this;

      node.config = {
        key: node.credentials.key
      };
    }


    function TimeDBReadNode(config) {
        RED.nodes.createNode(this,config);
        const axios = require("axios");
        var node = this;

        node.on('input', async function(msg) {

          let rapidapiconfig = RED.nodes.getNode(config.account);

          let db = node.context().get("db");

          // Force refresh of retention databases every hour
          let timeout = 0;
          let ts = node.context().get("last_manage");
          if((typeof db !== 'undefined') && (db !== null)) {
            timeout = ts * 1;
          }
          if((typeof db == 'undefined') || (db == null) || (timeout < new Date().getTime() - 3600000)) {
            let options = {
                method: 'GET',
                url: 'https://timedb.p.rapidapi.com/manage',
                headers: {
                  'content-type': 'application/json',
                  'x-rapidapi-host': 'timedb.p.rapidapi.com',
                  'x-rapidapi-key': rapidapiconfig.config.key
                }
            };
            let r = await axios.request(options);
            db = r.data.connect.database;
            node.context().set("db",db);
            node.context().set("last_manage",new Date().getTime());
          }


          let data = {};
          data.measurement = config.measurement;
          let query = "select * from "+config.measurement;

          if(rapidapiconfig !== null) {
            let options = {
                method: 'GET',
                url: 'https://timedb.p.rapidapi.com/query',
                headers: {
                  'content-type': 'application/json',
                  'x-rapidapi-host': 'timedb.p.rapidapi.com',
                  'x-rapidapi-key': rapidapiconfig.config.key
                },
                params: {query: query,database:db+config.retention},
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
    RED.nodes.registerType("TimeDBRead",TimeDBReadNode,{
     credentials: {
         account: {type:"timedb-config"}
     }
   });
}

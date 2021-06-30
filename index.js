
// require
var request = require('request');
const dbConfig = require("./config/config.js");
var md5 = require('md5');
// main thread
const { Worker, isMainThread, parentPort } = require('worker_threads');
if (isMainThread) {
  const worker = new Worker(__filename, { workerData: {} });
  worker.on('message', (booking) => {
    var booking = booking;
    //newbyidcategory.php
    var res = booking["poit_start"].split(",");
    request.post({ headers: { 'content-type': 'application/x-www-form-urlencoded' }, url: '' + dbConfig.URL + 'newbyidcategory.php', body: '{"lat":' + res[0] + ' ,"id":1 ,"lng":' + res[1] + ',"apikey":"' + dbConfig.APIKEY + '"}' }, async function (error, response, body) {
      if (body != "no result") {
        var drivers = await JSON.parse(body);
        let shouldSkip = false;
        let reservation_chek = false;
        drivers.forEach(async function (driver) {
          if (shouldSkip) {
            return;
          }
          // sget state by driver
          request.post({ headers: { 'content-type': 'application/x-www-form-urlencoded' }, url: '' + dbConfig.URL + 'booking/getstatebyiddriver.php', body: '{"id_chauffeur":' + driver["id_driver"] + ',"apikey":"' + dbConfig.APIKEY + '"}' }, async function (error, response, state_b) {
            var state_b = await JSON.parse(state_b);
            if (state_b["state"] != true) {
              shouldSkip = true;
            }
          });
          // set driver
          /*
          reservation.updateById(booking["id"],{id_chauffeur:driver['id_driver']},(err, update_driver) => {
            if(update_driver.state =="true"){
              console.log(update_driver);
            }
          });
          */
          request.post({ headers: { 'content-type': 'application/x-www-form-urlencoded' }, url: '' + dbConfig.URL + 'booking/setdriver.php', body: '{"driver":"' + driver['id_driver'] + '","id":5,"apikey":"' + dbConfig.APIKEY + '"}' }, async function (error, response, update_driver) {
            var update_driver = await JSON.parse(update_driver);
            if (update_driver.driver == true) {
              console.log(update_driver.driver);
            }
          });



          // set reservation 
          /*
          reservation.updateById(booking["id"],{statut:1},(err, update_state) => {
            if(update_state.state =="true"){
              console.log(update_state);
            }
          });
          */
          key = md5('1' + 'codex');
          request.post({ headers: { 'content-type': 'application/x-www-form-urlencoded' }, url: '' + dbConfig.URL + 'booking/setstate.php', body: '{"id":"'+booking["id"]+'","state":"1","key":"' + key + '","apikey":"' + dbConfig.APIKEY + '"}' }, async function (error, response, update_state) {
            var update_state = await JSON.parse(update_state);
            if (update_state.state == true) {
              console.log(update_state.state);
            }
          });

          // console.log(driver);
          for (i = 0; i <= parseInt(dbConfig.TIMEWAITING); i++) {
            console.log("in " + i);
            await sleep(900);
            if (reservation_chek) {
              return;
            }
            // getstate
            request.post({ headers: { 'content-type': 'application/x-www-form-urlencoded' }, url: '' + dbConfig.URL + 'booking/getstate.php', body: '{"id":' + booking["id"] + ' ,"apikey":"' + dbConfig.APIKEY + '"}' }, async function (error, response, state_resrvation) {
              if (!error && response.statusCode == 200) {
                var state_resrvation = await JSON.parse(state_resrvation);
                if (state_resrvation.state == -1) {
                  // if -1
                  moyen = 100 - parseInt(i * 3.3);
                  request.post({
                    headers: { 'content-type': 'application/x-www-form-urlencoded' }, url: '' + dbConfig.URL + 'chauffeur/set_taux.php', body: '{"id":' + driver["id_driver"] + ',"taux":' + moyen.toString() + ',"apikey":"' + dbConfig.APIKEY + '"}'
                  }, async function (error, response, state_b) {
                    if (!error && response.statusCode == 200) {
                      console.log("Driver Refused");
                      reservation_chek = true;
                    }
                  });
                }
                if (state_resrvation.state == 2) {
                  // if 2
                  console.log("Driver Accepted");
                  reservation_chek = true;
                }
                if (state_resrvation.state == -2) {
                  // if -2
                  console.log("Client Cancelled");
                  reservation_chek = true;
                }
              }
            });
          }
          // read state 
          request.post({ headers: { 'content-type': 'application/x-www-form-urlencoded' }, url: '' + dbConfig.URL + 'getstate.php', body: '{"id":' + booking["id"] + ' ,"apikey":"' + dbConfig.APIKEY + '"}' }, async function (error, response, state_resrvation_end) {
            if (!error && response.statusCode == 200) {
              var state_resrvation_end = await JSON.parse(state_resrvation_end);
              if (state_resrvation_end.state == 2 || state_resrvation_end.state == -2) {
                // if 2
                console.log("Driver Accepted");
                shouldSkip = true;
              } else {
                if (state_resrvation_end.state == -1) {
                  // set reservation 
                  /*
                  reservation.updateById(booking["id"],{statut:1},(err, update_state) => {
                    if(update_state.state =="true"){
                      console.log(update_state);
                    }
                  });*/
                  key = md5('1' + 'codex');
                request.post({ headers: { 'content-type': 'application/x-www-form-urlencoded' }, url: '' + dbConfig.URL + 'booking/setstate.php', body: '{"id":"'+booking["id"]+'","state":"1","key":"' + key + '","apikey":"' + dbConfig.APIKEY + '"}' }, async function (error, response, update_state) {
                  var update_state = await JSON.parse(update_state);
                  if (update_state.state == true) {
                    console.log(update_state.state);
                  }
                });


                }
              }
              if (state_resrvation_end.state = 1) {
                // set reservation 
                /*
                reservation.updateById(booking["id"],{statut:-4},(err, update_state) => {
                  if(update_state.state =="true"){
                    console.log(update_state);
                  }
                });
                */
                key = md5('-4' + 'codex');
                request.post({ headers: { 'content-type': 'application/x-www-form-urlencoded' }, url: '' + dbConfig.URL + 'booking/setstate.php', body: '{"id":"'+booking["id"]+'","state":"-4","key":"' + key + '","apikey":"' + dbConfig.APIKEY + '"}' }, async function (error, response, update_state) {
                  var update_state = await JSON.parse(update_state);
                  if (update_state.state == true) {
                    console.log(update_state.state);
                  }
                });



              }
            }
          });
        });
      } else {
        // set reservation 
        /*
        reservation.updateById(booking["id"],{statut:-4},(err, update_state) => {
          if(update_state.state =="true"){
            console.log(update_state);
          }
        });
        */
        key = md5('-4' + 'codex');
        request.post({ headers: { 'content-type': 'application/x-www-form-urlencoded' }, url: '' + dbConfig.URL + 'booking/setstate.php', body: '{"id":"'+booking["id"]+'","state":"-4","key":"' + key + '","apikey":"' + dbConfig.APIKEY + '"}' }, async function (error, response, update_state) {
          var update_state = await JSON.parse(update_state);
          if (update_state.state == true) {
            console.log(update_state.state);
          }
        });



      }
    });
  });
  worker.on('error', () => console.log('Error'));
  worker.on('exit', () => { console.log('Worker exit') });
} else {
  setInterval(() => {
    // reservation thread
    /*
        reservation.getbooking_by_state('0', async (err, data_reservation) => {
          if (data_reservation.length != 0) {
    
            var reservation_info = await JSON.parse(data_reservation);
            reservation_info.forEach(function(booking) {
              parentPort.postMessage(booking);
            });
    
          }
        });
        */

     request.post({headers: {'content-type' : 'application/x-www-form-urlencoded'},url:''+dbConfig.URL+'booking/read.php',body:'{"state":"0","limit":5,"apikey":"'+dbConfig.APIKEY+'"}'}, async function(error, response, data_reservation){
       var data_reservation = await JSON.parse(data_reservation);
       if (data_reservation.length != 0) {
         data_reservation.forEach(function(booking) {
          parentPort.postMessage(booking);
       });
     }
      });
      

    // statelogin
    request.post({ headers: { 'content-type': 'application/x-www-form-urlencoded' }, url: '' + dbConfig.URL + 'statelogin.php', body: '{"time":2,"apikey":"' + dbConfig.APIKEY + '"}' }, async function (error, response, state_driver) { });
  }, 1000)
}
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}






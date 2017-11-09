var status; //Boolean, this conditoional can be removed it was just dependant in the original use. 
var plusOne; //Function which will add one to the DB counter 
var minosOne; //Function, decrement counter in the DB. 
var test; //Int, use it as a copy for the counter value in the DB. 
var dontSend; //Boolean, Use this value as your output if you'd like to do anything dependant on the counter, else remove it. 
var Firebase = require('firebase');
var config = {
  apiKey: "AIzaSyAIIV5RilYCz3Egtxd0ps-M_6iN2JgfEcU",
  authDomain: "temperature-monitor-pi.firebaseapp.com",
  databaseURL: 'https://temperature-monitor-pi.firebaseio.com/',
  storageBucket: "<BUCKET>.appspot.com",
};
Firebase.initializeApp(config);




//controls the counter in the DB dependant on status of the temperature
function setFlag(status) { 
    //console.log('start of setcount') //debug line
    if (status == true) { 
        plusOne()
        console.log('line 98')
        count = admin.database().ref('/Counter/KyQFZiBw-F_NF1NdstD/')                   //This is where you reference your tree in the DB
        count.once('value', function(snapshot){
        test = snapshot.val()
        //console.log('line 101 - ' + test + ' + ' + test.value) //debug line                   //debug line 
        if (test.value == 5) { 
            return dontSend = false; } 
        else if (test.value > 5) {                  //Delete these lines unless you wnt a limit on the counter. 
            //console.log('line 106')                   //debug line                  
            dontSend = true; 
            return count.update({                   // Update the Counter in the DB. keeps it in the limit.
            value: (5) })} 
        else { 
            dontSend = true;
            return;
            }
        }) 
    }
    else if (status == false) {
        minusOne()
        count = admin.database().ref('/Counter/KyQFZiBw-F_NF1NdstD/')
        count.once('value', function(snapshot){
        test = snapshot.val()
        //console.log('line 118 - ' + test + test.value)                    //debug line
        if (test.value == 0) { 
            return dontSend = false;}
        else if (test.value < 0) { 
            dontSend = true;
            return count.update({                   
            value: (0) })}
            else { 
                dontSend = true;
                return;
            }
        })
    }    
    return ;
}
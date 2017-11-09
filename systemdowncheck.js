//--SYSTEM DOWN CHECK--Check for last database entry every 5 minutes---------//
//---------------------------------------------------------------------------//

//1. Take the last entry in the database under temperature  --------
exports.systemDownCheck = functions.https.onRequest((req, res) => {
    
    var db = admin.database();
    var ref = db.ref('/temperature');
    ref.limitToLast(1).on('child_added', function(snapshot) {
            
            console.log('The last added value')
            console.log(snapshot.val().time);
            
            
            logmin = snapshot.val().time;
    
    //2. Get a current timestamp by joining getHours, getMinutes and getSeconds using Date  --------
    
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    var s = d.getSeconds();
            
            console.log(h + ':' + m + ':' + s)
    
    //3. Map variables to the timestamp and minutes values of the database entry and server time --------
    
    var DBtimestamp = logmin.substr(3, 2);
    var Servertimestamp = m       
    var fullServerStamp = h + ':' + m + ':' + s
            
    //4. Calculate absolute value difference in minutes between the two timestamps  --------
    
        if (Math.abs(Servertimestamp - DBtimestamp) >= 5) 
            {
            console.log('Down')
            sysDown = true;
            } else 
                {
                console.log('fine')
                sysDown = false;            
                }
    
    //5. Obtain reference to sysdownflag which is used to verify if system is down  --------
    
    admin.database().ref('/').child('sysdownflag').child('KyMK50EnhKUQkhRVSb0').once('value', function(snapshot){
    
                console.log('QWERTTY')
                console.log(sysDown)
                console.log(snapshot.val().flag)
                sysFlag = snapshot.val().flag
    
                var fruits = ["Banana", "Orange", "Apple", "Mango"];
                
                console.log('Array')
                console.log(fruits);
    
    //6.    Uses value of sysDown to determine if the system is down and which email to send  --------
    //      sysFlag is used to prevent duplicate emails sending, acting as an on/off gate  --------
    //      NOTE: if you reverse the update values, you will receive emails every 5 minutes  --------
    
        if (sysDown == true && sysFlag == 1) 
            {
    
            admin.database().ref('/').child('sysdownflag').child('KyMK50EnhKUQkhRVSb0').update({flag: '0'});
                    
            const sysDownEmail = 
            {
            from: piEmail,
            to: mailingList,
            subject: 'System Down at ' + fullServerStamp,
            text: 'The system last recorded an entry at ' + logmin + ', the system is currently down.'
            }
        return transporter.sendMail(sysDownEmail).then(() => 
        {
        }).catch(error => 
        {
        res.send(error)
        })
                    
        } else if (sysDown == false && sysFlag == 0) 
            {
    
            admin.database().ref('/').child('sysdownflag').child('KyMK50EnhKUQkhRVSb0').update({flag: '1'});
                    
            const sysOKEmail = 
            {
            from: piEmail,
            to: mailingList,
            subject: 'System OK. Running at ' + fullServerStamp,
            text: 'The system was previously down but is now running as expected again. The last entry was at ' + logmin
            }
        return transporter.sendMail(sysOKEmail).then(() => 
        {
        }).catch(error => 
        {
        res.send(error)
        })
        }
        });
    
    //a. Cron is used to call this function every 5 minutes, no extra code is required here
    //   It is setup at cron-job.org
    //   On successful deploy, a function URL is given in command line to verify link with Cron
    //   If this URL doesn't show, check the cron job is active and that this function was not re-named
    
    //--END--SYSTEM DOWN CHECK---------------------------------------------------//
    //---------------------------------------------------------------------------//
        });
    }); 
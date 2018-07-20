

export function generateSerial() {
    let unique = true;
    let serial = '';
    let arr = ['A','B','C','D','E','F','H','G','J','K','M','N','P','Q','R','S','T','U','V','W','X','Y','Z','2','3','4','5','6','7','8','9'];

    for (let i = 0; i < 10; ++i) { 
        let pos = Math.floor(Math.random() * Math.floor(arr.length));
        serial = serial + arr[pos];
    }

    return serial;
}

export function isUserLoggedOn() {
    let isLogged =  sessionStorage.getItem('CurrentUser') != null;
    return isLogged;
}
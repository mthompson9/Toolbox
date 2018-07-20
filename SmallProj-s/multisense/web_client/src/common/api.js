import axios from 'axios';

import * as helperFunctions from './helperFunctions'


export var Common = {
    doesSerialExist: async (serial) => {
        const deviceWithSerial = await DeviceConfig.getWithSerialNumber(serial);
        if (deviceWithSerial != null) return true;

        const sensorWithSerial = await SensorConfig.getWithSerialNumber(serial);
        if (sensorWithSerial != null) return true;

        return false;
    },
    generateUniqueSerial: async () => { 
        let serial = "";
        let dupe = true;
        while (dupe) {
            serial = helperFunctions.generateSerial();
            dupe = await Common.doesSerialExist(serial);
        }

        return serial;
    }
}

export var DeviceType = {
    getDeviceTypes: () => {
        return get('/device_type?deleted=eq.false');
    },
    getDeviceType: (id) => {
        return get('/device_type?id=eq.' + id);
    },
    update: (id, data) => {
        return patch('/device_type?id=eq.' + id, data);
    },
    create: (data) => {
        return post('/device_type', data);
    },
    delete: (id) => {
        return patch('/device_type?id=eq.' + id, {deleted: true} );
    },
}

export var SensorType = {
    getSensorTypes: () => {
        return get('/sensor_type?deleted=eq.false');
    },
    getSensorType: (id) => {
        return get('/sensor_type?id=eq.' + id);
    },
    update: (id, data) => {
        return patch('/sensor_type?id=eq.' + id, data);
    },
    create: (data) => {
        return post('/sensor_type', data);
    },
    delete: (id) => {
        return patch('/sensor_type?id=eq.' + id, {deleted: true} );
    },
}


export var DeviceConfig = {
    getWithSerialNumber: async (serial) => {
        const device_configs = await get('/device_config?serial_num=eq.' + serial);
        if (device_configs.data.length > 0)
            return device_configs.data[0];
        else
            return null;
    },

    getDeviceConfigs: () => {
        return get('/device_config?deleted=eq.false&select=*,device_type(*)');
    },
    getDeviceConfig: (id) => {
        return get('/device_config?id=eq.' + id);
        // return get('/device_config?select=*,device_type(*)' + id);

    },
    getDeviceTypes: () => {
        return get('/device_type?select=*');
    },
    update: (id, data) => {
        return patch('/device_config?id=eq.' + id, data);
    },
    create: (data) => {
        return post('/device_config', data);
    },
    delete: (id) => {
        return patch('/device_config?id=eq.' + id, {deleted: true} );
    },
}


export var User = {
    getUsers: () => {
        return get('/user?deleted=eq.false');
    },

    // Can possibly be deleted as session storage now holds the users email (Hacky fix for now I know) and to 
    // reach any page past the login screen with our current design the user will have to be logged in.
    // However may prove useful for 'Admin' Accounts
    getUser: (id) => {
        return get('/user?id=eq.' + id);
    },

    update: (id, data) => {
        return patch('/user?id=eq.' + id, data);
    },
    create: (data) => {
        return post('/user', data);
    },
    delete: (id) => {
        return patch('/user?id=eq.' + id, {deleted: true} );
    },

    // A function for a cleaner way to check the data for login - didn't want to delete the existing way. 
    // Means less data loaded into the front-end (Value increases with the number of records in the DB).
    getThisUser: (username) => { 
        return get('/user?name=eq.' + username + '&deleted=eq.false')
    },
}

export var Experiment = {
    getExperiment: (id) => {
        return get('/experiment?select=*,user(*),experiment_device(*,device_config(*))&experiment_device.deleted=eq.false&id=eq.' + id);
    },
    create: (data) => {
        return post('/experiment', data);
    },
    update: (id, data) => {
        return patch('/experiment?id=eq.' + id, data);
    },
    delete: (id) => {
        return patch('/experiment?id=eq.' + id, {deleted: true, finished:true });
    },
    getAllExperiments: () => {
        return get('/experiment?select=*,user(*)&order=id.desc&deleted=eq.false');
    },
    getUserExperiments: (id) => { 
        return get('/experiment?user_id=eq.' + id + '&select=*,user(*)&order=id.desc&deleted=eq.false');
    }, 
    //returns all sensor ids that are currently in use by active experiments
    getUsedSensors:() => {
        return get('/experiment?finished=eq.false&deleted=eq.false&select=experiment_device(device_config_id, experiment_sensor(sensor_config_id))&experiment_device.deleted=eq.false&experiment_device.experiment_sensor.deleted=eq.false')
        .then( res => {            
            /*
            Returns information like:
            [
                {
                    "experiment_device": [
                        {
                            "device_config_id": 1,
                            "experiment_sensor": [
                                {
                                    "sensor_config_id": 3
                                },
                            ]
                        }
                    ]
                }
            ]
            */

        });
    }
}

export var ExperimentSensor = {
    getExperimentSensor: (id) => {
        return get('/experiment_sensor?select=*,sensor_config(*,sensor_type(*))&id=eq.' + id );
    }, 
    create: (data) => {
        return post('/experiment_sensor', data);
    },
    update: (id, data) => {
        return patch('/experiment_sensor?id=eq.' + id, data);
    },
    getLastMeasurement: (sensorId) => {
        return get("/experiment_measurement?order=when.desc&limit=1&exp_sensor_id=eq." + sensorId);
    },
    delete: (id) => {
        return patch('/experiment_sensor?id=eq.' + id, {deleted: true} );
    }
}

export var UserD = {
    getUserD: (id) => {
        return get('/user?select=*,user(*,name(*))&id=eq.' + id );
    }, 
    create: (data) => {
        return post('/user', data);
    },
    update: (id, data) => {
        return patch('/user?id=eq.' + id, data);
    },
    getLastMeasurement: (userId) => {
        return get("/experiment_measurement?order=when.desc&limit=1&exp_sensor_id=eq." + userId);
    }
}


export var ExperiementDevice = {
    getExperimentDevice: (id) => {//deleted=eq.false&
        return get('/experiment_device?select=*,device_config(*),experiment_sensor(*, sensor_config(*))&experiment_sensor.deleted=eq.false&id=eq.' + id);
    },
    create: (data) => {
        return post( '/experiment_device', data);
    },
    update: (id, data) => {
        return patch('/experiment_device?id=eq.' + id, data);
    },
    delete: (id) => {
        return patch('/experiment_device?id=eq.' + id, {deleted: true} );
    },
}

export var SensorConfig = {
    getWithSerialNumber: async (serial) => {
        const sensors_configs = await get('/sensor_config?serial_num=eq.' + serial);
        if (sensors_configs.data.length > 0)
            return sensors_configs.data[0];
        else
            return null;
    },
    getSensorConfig: (id) => {
        return get('/sensor_config?id=eq.' + id);
    },
    getSensorConfigs: () => {
        return get('/sensor_config?deleted=eq.false&order=id.desc');
    },
    //was a fix to only display configs whos deleted column != true. however messes with the selection due to id's being diff to whats in the DB. 
    // getSensorConfigs2: () => {
    //     return get('/sensor_config?select=*,deleted=eq.false');
    // },
    delete: (id) => {
        console.log(id)
        return patch('/sensor_config?id=eq.' + id, {deleted: true});
    },
    getSensorTypes: () => {
        return get('/sensor_type?select=*');
    },
    create: (data) => { 
        return post('/sensor_config', data);
    },
    update: (id, data) => {
        return patch('/sensor_config?id=eq.' + id, data);
    },
}


// export var user ={
//     getUser: () => {
//         return get('/user?select=*,name(*)');
//     }
// }

// export var DeviceConfig = {
//     getDeviceConfigs: () => {
//         return get('/device_config?select=*,device_type(*)');
//     } 
// }

export function getBasePath() {
    let host = window.location.hostname;
    //host = "ec2-35-176-56-166.eu-west-2.compute.amazonaws.com"
    return "http://" + host + ":3000";
}

export function post(path, data) {
    const headers = {
        headers: {
            'Content-Type': 'application/json', "Prefer": "return=representation"
        }
    }

    return axios.post(getBasePath() + path, data, headers).catch(err => {
        processError(err);
        throw err;
    });
}

export function patch(path, data) {
    return axios.patch(getBasePath() + path, data).catch(err => {
        processError(err);
        throw err;
    });
}

export function get(path) {
    return axios.get(getBasePath() + path).catch(err => {
        processError(err);
        throw err;
    });
}

export function processError(err) {
    alert( err + ":" + JSON.stringify(err, null, 2) );
}


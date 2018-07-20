import React from 'react';
import {TextField, RaisedButton, MenuItem, SelectField, Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui';
import SensorsTable from './sensors_table'
import {api, urlFunctions, styles} from '../../../common';
import {Link} from 'react-router-dom';

export default class ExperimentDevice extends React.Component {

    constructor(props)  {
        super(props)

        this.state = {
            device_configs: [ //example data only
                {
                    "id": 2,
                    "device_type_id": 1,
                    "description": "another pi",
                    "serial_num": "PI2345",
                    "location": "JH",
                    "hardware_version": "v1",
                    "comment": "comment",
                    "date_created": "2018-03-04T18:39:37.926966",
                    "deleted": false,
                    "device_type": {
                        "id": 1,
                        "name": "a pi",
                        "description": "a description",
                        "date_created": "2018-03-04T18:39:37.912407",
                        "deleted": false
                    }
                }
                ],
            device_config_id:  -1,
            loaded: false,
            name: "device name",
            changed: false
        }
    }

    componentDidMount = () => this.fetchData();

    fetchData = () => {
        //get all the devices so we can diplay them in the drop down
        api.DeviceConfig.getDeviceConfigs()
        .then(dc => {
            this.setState( {device_configs: dc.data} );
            
            //if we're altering an already existing experiment device, get the details of that experiment and the sensor details
            if (this.isExistingExperimentDevice()) {
                api.ExperiementDevice.getExperimentDevice(this.experimentDeviceId())
                .then( exp => {
                    //set the details
                    exp = exp.data[0];
                    this.setState( {
                        complete_device_info: exp,
                        device_config_id: exp.device_config_id, 
                        name: exp.name, 
                        exp_device_details: exp,
                        loaded: true  
                    } );
                });

            } else {
                // all loaded
                this.setState( { loaded: true } )
            }
        });
    }

    //if modifying an already existing experiment, get the id from the URL
    experimentDeviceId = () => this.props.match.params.id;
    isExistingExperimentDevice = () => this.props.match.params.id !== undefined;
    experimentId = () => {
        if (this.isExistingExperimentDevice()) 
            return this.state.exp_device_details.exp_id;
        else
            return urlFunctions.getUrlParameter("exp_id") ;
    }

    //create the device record before moving on to the next page
    createDevice = (moveNext=true) => {
        
        let data = {
            name: this.state.name, 
            device_config_id: this.state.device_config_id,
            exp_id: this.experimentId()
        };

        if (this.isExistingExperimentDevice()) {
            this.updateDatabase(data, () => {
                if (moveNext)
                    this.props.history.push('/admin/experiment_sensor?exp_device_id=' + this.experimentDeviceId());
                else
                    this.setState({changed: false});
            });

        } else {
            //create the experiment 
            api.ExperiementDevice.create(data)
            .then( created => {
                let exp_dev_id = created.data[0].id;

                //alter the current url so that if the user goes back to it then it loads the one we just created
                this.props.history.replace('/admin/experiment_device/' + exp_dev_id );

                if(moveNext)
                    this.props.history.push('/admin/experiment_sensor?exp_device_id=' + exp_dev_id);

            });
        }
    }

    //When the user clicks on save, update the database and call the callback function
    updateDatabase = (state, callback) => {
        if (!this.state.changed) callback();

        this.setState(state, () => {

            //update the data on the database. TODO: need to be more clever about this to not update each time. pudate after 1 seonc of no user changes. etc
            if(this.isExistingExperimentDevice()) {
                api.ExperiementDevice.update(this.experimentDeviceId(), state)
                .then( () => {
                    callback();
                });
            }
        })
    }

    deleteDevice = async ()  => {

        await api.ExperiementDevice.delete(this.experimentDeviceId());

        this.props.history.replace('/admin/experiment/' + this.experimentId() )

    }

    //function to generate the config file. 
    generateConfig = (exp_id) => { 
        // let user_id = null;
        let pos = exp_id;
        let dev_id = this.state.device_config_id;
        let holder = this.state.complete_device_info.experiment_sensor;
        let sen_type = '';
        let sen_id = '';
         let data = [];
        
        //For each sensor, add a data object to the final object to be pushed with 
        //neccessary info. 
        holder.forEach( sensor => { 
            console.log(sensor)
             sen_id = sensor.sensor_config_id;
             sen_type = sensor.sensor_config.sensor_type_id; 
            let sensor_data = {
                [dev_id]: {
                    [sen_id]: {
                        'sen_type': [sen_type] 
                    }  
                }   
            };

            data.push(sensor_data)
        });

        // debug lines 
        // console.log('Experiment ID is: ' + exp_id)
        // console.log(data.Devices[dev_id])
        // console.log(this.state.complete_device_info)

        //Call the download function
        return this.saveJSON(data, (this.state.complete_device_info.name + '_config.json'))
    };



    //download the Config.JSON 
    saveJSON = (data, filename) => {
        //Stringify the data and format it so it isn't all on one line
        data = JSON.stringify(data, null, 2)
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(data);
        var link = document.createElement("a");
        link.setAttribute("href", dataStr);
        link.setAttribute("download", filename);
        document.body.appendChild(link); // Required for FF        
        link.click();
    };



    //update the the state 
    updateValue = (name, value) => {
        const  state = {[name]: value, changed: true};
        this.setState(state);
    }
    
    render() {
        if (!this.state.loaded)
            return "";

        const disableSaveButton = !this.state.changed || !(this.state.changed || this.isExistingExperimentDeviceiment());
        let sensors_table = [];
        if (this.isExistingExperimentDevice() && this.state.exp_device_details.experiment_sensor.length > 0 ) {
            
            sensors_table = <SensorsTable 
                experiment_sensors={this.state.exp_device_details.experiment_sensor} 
                onSelection={ (exp_sensor_id) => this.props.history.push('/admin/experiment_sensor/' + exp_sensor_id)  }
                />;
        }

        return ( 
            <div>
                <Link to={"/admin/experiment/" + this.experimentId() }>&lt; Back to experiment</Link>
                
                <br/>
                <TextField 
                floatingLabelText="Device Name" 
                value={this.state.name}
                onChange={(e,v) =>  this.updateValue('name', v) } /><br />

                <SelectField
                    floatingLabelText="Device"
                    value={this.state.device_config_id}
                    onChange={(e,i,v) =>  this.updateValue('device_config_id', v)  }
                    >
                    {
                        this.state.device_configs.map( device => 
                            <MenuItem value={device.id} primaryText={device.device_type.name + " - " + device.serial_num} />
                        )
                    }
                </SelectField>
                <br/>

                {sensors_table}

                <RaisedButton label="Add sensor to device" 
                    primary={true} 
                    onClick={ () => { this.createDevice() } } 
                    style={{marginRight: 12, marginBottom: 12}}
                />
                
       

                <br/> 


                {/* save and delete icons */}           
                 <RaisedButton label="Save" 
                    primary={false} 
                    onClick={ () => this.createDevice(false) } 
                    style={{marginRight: 12 }}
                    disabled={ disableSaveButton }
                />
        
                <RaisedButton 
                    label="Delete"
                    onClick={ () => this.deleteDevice() } 
                    disabled={!this.isExistingExperimentDevice()}
                    style={{marginRight: 12 }}
                    primary={false}
                />     

                         <RaisedButton 
                    label="Download Config.json"
                    disabled={!this.isExistingExperimentDevice()}
                    primary={false}
                    // onClick={console.log(this.state.complete_device_info.experiment_sensor[0].sensor_config_id)}
                    onClick={() => this.generateConfig(this.state.exp_device_details.exp_id)}
                    style={{marginRight: 12}}
                />   

            </div>
        );
    }

}



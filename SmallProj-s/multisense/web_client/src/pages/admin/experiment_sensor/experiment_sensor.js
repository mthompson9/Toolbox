import React from 'react';
import {SelectField, MenuItem, RaisedButton, TextField} from 'material-ui';
import {api, urlFunctions, styles} from '../../../common'
import {Link} from 'react-router-dom';


export default class ExperimentSensor extends React.Component {

    constructor(props)  {
        super(props)

        this.state = {
            sensor_device_details: { //example data
                "id": 17,
                "sensor_config_id": 2,
                "exp_device_id": 5,
                "name": "sensor name",
                "date_created": "2018-03-05T20:45:11.751802",
                "deleted": false,
                "sensor_config": {
                    "id": 2,
                    "sensor_type_id": 1,
                    "serial_num": "TEMP2345",
                    "date_created": "2018-03-04T18:39:37.940019",
                    "deleted": false,
                    "sensor_type": {
                    "id": 1,
                    "name": "temp",
                    "description": "a desc",
                    "unit": "C",
                    "date_created": "2018-03-04T18:39:37.933638",
                    "deleted": false
                    }
                }
            },
            sensor_config_id: -1,
            loaded: false,
            name: "sensor name", 
            changed: false
        }
    }

    componentDidMount = () => this.fetchData();

    //Load the data
    fetchData = () => {
        //get all the devices so we can diplay them in the drop down
        api.SensorConfig.getSensorConfigs()
        .then(dc => {
            this.setState( {sensor_configs: dc.data} );
            
            //if we're altering an already existing experiment device, get the details of that experiment and the sensor details
            if (this.isExistingSensorDevice()) {
                return api.ExperimentSensor.getExperimentSensor( this.experimentSensorId() )
                    .then( sen => {
                        //set the details
                        sen = sen.data[0];
                        this.setState( {
                            sensor_config_id: sen.sensor_config_id, 
                            name: sen.name, 
                            sensor_device_details: sen,
                            loaded: true  
                        } );
                    });

            } else {
                this.setState( { loaded: true } )
            }
        });
    }

    //if modifying an already existing experiment, get the id from the URL
    experimentSensorId = () => this.props.match.params.id;
    isExistingSensorDevice = () => this.props.match.params.id !== undefined;
    experimentDeviceId = () => {
        if (this.isExistingSensorDevice())
            return this.state.sensor_device_details.exp_device_id;
        else 
            return urlFunctions.getUrlParameter("exp_device_id") ;
    }

    //create the device record before moving on to the next page
    createSensor = () => {
        let data = {
            name: this.state.name,
            sensor_config_id: this.state.sensor_config_id,
        };

        if (this.isExistingSensorDevice()) {
            this.updateDatabase(data, () => {
                this.setState({changed: false});
            });

        } else {
            data.exp_device_id = this.experimentDeviceId();

            //create the experiment
            api.ExperimentSensor.create(data)
            .then( created => {
                let exp_id = created.data[0].id;
                this.props.history.replace('/admin/experiment_sensor/' + exp_id);
            });
        }
    }

    //update the existing sensor record, if the user has changed
    updateDatabase = (state, callback) => {
        if (!this.state.changed) callback();

        this.setState(state, () => {
            //update the data on the database. TODO: need to be more clever about this to not update each time. pudate after 1 seonc of no user changes. etc
            if(this.isExistingSensorDevice()) {
                api.ExperimentSensor.update(this.experimentSensorId(), state  )
                .then( res => {
                    callback();
                });
            }
        })
    }

    deleteSensor = async () => {
        await api.ExperimentSensor.delete( this.experimentSensorId() );

        this.props.history.replace( '/admin/experiment_device/' + this.experimentDeviceId()  );
    }


    //update the state with the new value
    updateValue = (name, value) => {
        const  state = {[name]: value, changed: true};
        this.setState(state);
    }

    render() {
        if (!this.state.loaded)
            return "";

        const disableSaveButton = !this.state.changed || !(this.state.changed || this.isExistingSensorDevice());

        return ( 
            <div>
                <Link to={"/admin/experiment_device/" + this.experimentDeviceId() }>&lt; Back to experiment device</Link>
                <br/>

                <TextField 
                floatingLabelText="Sensor name" 
                value={this.state.name}
                onChange={(e,v) =>  this.updateValue('name', v) } /><br />

                <SelectField
                    floatingLabelText="Sensor"
                    value={this.state.sensor_config_id}
                    onChange={(e,i,v) =>  this.updateValue('sensor_config_id', v)  }
                    >
                    {
                        this.state.sensor_configs && 
                        this.state.sensor_configs.map( sensor_config => 
                            <MenuItem value={sensor_config.id} primaryText={ sensor_config.serial_num} />
                        )
                    }
                </SelectField>
                <br/>

                {/* save and delete icons */}           
                <RaisedButton label="Save" 
                    primary={false} 
                    onClick={ () => this.createSensor(false) } 
                    style={{marginRight: 12 }}
                    disabled={ disableSaveButton }
                />
        
                <RaisedButton 
                    label="Delete"
                    disabled={ !this.isExistingSensorDevice() }
                    onClick={ () =>  this.deleteSensor() } 
                    primary={false}
                />     


            </div>
        );
    }

}



import React from 'react';
import {SelectField, MenuItem, RaisedButton, TextField} from 'material-ui';
import {api, urlFunctions, styles, helperFunctions} from '../../../common'
import {Link} from 'react-router-dom';


export default class SensorConfig extends React.Component {

    constructor(props)  {
        super(props)

        this.state = {
            disabledText: false,
            sensor_config_id: -1,
            loaded: false,
            changed: false,
            edit: false, 

            sensor_type: "",
            serial_num: "",

            serial_num_error_text: null,
            sensor_type_error_text: null
        }
    }

    componentDidMount = () => {
        ( async () => {
            this.fetchData();
        })();
    }



    //Load the data
    fetchData = async () => {

        let sensor_types = await api.SensorConfig.getSensorTypes();
        sensor_types = sensor_types.data;

        if (this.isExistingSensorConfig()) { 
            let sensor_config = await api.SensorConfig.getSensorConfig(this.sensorConfigId());
            sensor_config = sensor_config.data[0];

            this.setState({
                sensor_config_id: this.sensorConfigId(),
                loaded: true,
                sensor_type: sensor_config.sensor_type_id,
                serial_num: sensor_config.serial_num,
                sensor_types: sensor_types
            });


        } else {
            let sensor_configs = await api.SensorConfig.getSensorConfigs();
            sensor_configs = sensor_configs.data;

            let serial = await api.Common.generateUniqueSerial();

            this.setState({
                loaded: true,
                sensor_types: sensor_types,
                sensor_configs: sensor_configs,
                serial_num: serial,
            });
        }
    }

    sensorConfigId = () => this.props.match.params.id;
    isExistingSensorConfig = () => this.props.match.params.id !== undefined;

    //create the device record before moving on to the next page
    createSensor = async () => { 

        if (!await this.isValid()) return;

        if (!this.isExistingSensorConfig()) { 
            let data = {
                serial_num: this.state.serial_num,
                sensor_type_id: this.state.sensor_type,
            };

            let created = await api.SensorConfig.create(data);
            let exp_id = created.data[0].id;
            this.props.history.replace('/admin/sensor_config_new/' + exp_id);
            this.props.history.push('/admin/sensor_config_list');

        } else { 
            let data = { 
                serial_num: this.state.serial_num,
                sensor_type_id: this.state.sensor_type,
            };

            await api.SensorConfig.update(this.state.sensor_config_id, data);
            this.props.history.push('/admin/sensor_config_list');
        }
    }


    isValid = async () => {
        let valid = true;
        let errors = {serial_num_error_text: null, sensor_type_error_text: null}

        if (this.state.sensor_type === "") {
            errors.sensor_type_error_text = "Please select a sensor type";
            valid = false;
        }

        this.setState( errors );
        return valid;
    }

    //update the state with the new value
    updateValue = (name, value) => {
        const  state = {[name]: value, changed: true};
        this.setState(state);
    }

    deleteSensor = async (id) =>  {  
        await api.SensorConfig.delete(id);
        this.props.history.push("/admin/sensor_config_list/");
    }

    render() {
        if (!this.state.loaded)
            return "";

        const disableSaveButton = !this.state.changed || !(this.state.changed || this.isExistingSensorConfig());

        return ( 
            <div>
                <TextField
                    floatingLabelText="Sensor Serial Number"
                    value={this.state.serial_num}
                    errorText={this.state.serial_num_error_text}
                    onChange={(e,v) =>  this.updateValue('serial_num', v)}
                    disabled={true}
                    
                    /><br/>
                <SelectField
                    floatingLabelText="Sensor Type"
                    value={this.state.sensor_type}
                    errorText={this.state.sensor_type_error_text}
                    onChange={(e,i,v) =>  this.updateValue('sensor_type', v)  }
                    >
                    {
                        this.state.sensor_types && 
                        this.state.sensor_types.map( sensor_type => 
                            <MenuItem value={sensor_type.id} primaryText={ sensor_type.name} />
                        )
                    }
                </SelectField>
                <br/>
                {/* save and delete icons */}           
                <RaisedButton label="Save" 
                    primary={false} 
                    onClick={ () => this.createSensor() } 
                    style={{marginRight: 12 }}
                    disabled={ disableSaveButton }
                />
        
                <RaisedButton 
                    label="Delete"
                    disabled={ !this.isExistingSensorConfig() }
                    primary={false}
                    onClick={ () => this.deleteSensor( this.sensorConfigId() )  }   //TODO this function will actually change the deleted column of the config to true, however it still shows up as in the DB? 
                />     


            </div>
        );
    }

}



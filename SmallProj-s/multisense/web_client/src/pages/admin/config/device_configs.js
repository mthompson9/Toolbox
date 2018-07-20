import React from 'react';
import {SelectField, MenuItem, RaisedButton, TextField} from 'material-ui';
import {api, urlFunctions, styles} from '../../../common'
import {Link} from 'react-router-dom';


export default class DeviceConfigTable extends React.Component {
   
    constructor(props)  {
        super(props)


       
        this.state = {
            device_config_id: -1,
            loaded: false,
            changed: false,
            edit: false, 

            device_type: "",
            serial_num: "",
            description: "",
            location: "",
            hardware_version: "",


            serial_num_error_text: null,
            device_type_error_text: null
        }
    }
    
    componentDidMount = () => {
        ( async () => {
            this.fetchData();
        })();
    }

   
    //Load the data
    fetchData = async () => {

        let device_types = await api.DeviceConfig.getDeviceTypes();
        device_types = device_types.data;

        if (this.isExistingDeviceConfig()) { 
            let device_config = await api.DeviceConfig.getDeviceConfig(this.deviceconfigid());
            device_config = device_config.data[0];

            this.setState({
                deviceconfig_id: this.deviceconfigid(),
                loaded: true,
                device_types: device_types,
                serial_num: device_config.serial_num,
                description: device_config.description,
                location: device_config.location,
                hardware_version: device_config.hardware_version
                
            })


        } else {
            let serial_num = await api.Common.generateUniqueSerial();

            this.setState({
                loaded: true,
                serial_num: serial_num,
                device_types: device_types
            })
        }
        
    }



    //if modifying an already existing experiment, get the id from the URL
    deviceconfigid = () => this.props.match.params.id;
    isExistingDeviceConfig = () => this.props.match.params.id !== undefined;

    //create the device record before moving on to the next page
    createDeviceConfig = async () => { 

        if (!await this.isValid()) return;

        if (!this.isExistingDeviceConfig()) { 
            let data = {
                serial_num: this.state.serial_num,
                location: this.state.location,
                hardware_version: this.state.hardware_version,
                description: this.state.description,
                device_type_id: this.state.device_type,

            };

            let created = await api.DeviceConfig.create(data);
            let exp_id = created.data[0].id;
            this.props.history.replace('/admin/device_configs/' + exp_id);
            this.props.history.push('/admin/device_config_list');

        } else { 
            let data = { 
             
                serial_num: this.state.serial_num,
                location: this.state.location,
                hardware_version: this.state.hardware_version,
                description: this.state.description,
                device_type_id: this.state.device_type,

            };

            await api.DeviceConfig.update(this.state.device_config_id, data);
            this.props.history.push('/admin/device_config_list');
        }
    }
  


    isValid = async () => {
        let valid = true;
        let errors = {serial_num_error_text: null, device_type_error_text: null}

        if (this.state.serial_num === "") {
            errors.serial_num_error_text = "Please enter a serial number";
            valid = false;
        } else {
            let config = await api.DeviceConfig.getWithSerialNumber(this.state.serial_num);

            if (config != null && config.id != this.deviceconfigid()) {
                errors.serial_num_error_text = "Serial number not unique";
                valid = false;
            } 
        }

        if (this.state.device_type === "") {
            errors.device_type_error_text = "Please select a device type";
            valid = false;
        }

        this.setState( errors );
        return valid;
    }

    updateValue = (name, value) => {
        const  state = {[name]: value, changed: true};
        this.setState(state);
    }

    deleteDevice = async (id) =>  {  
        await api.DeviceConfig.delete(id);
        this.props.history.push("/admin/device_config_list/");
    }


    render() {
        if (!this.state.loaded)
            return "";

            const disableSaveButton = !this.state.changed || !(this.state.changed || this.isExistingDeviceConfig());

        return ( 
            <div style={{padding: 25, paddingTop: 25}}>
                    
                    <SelectField
                    floatingLabelText="Device Type"
                    value={this.state.device_type}
                    errorText={this.state.device_type_error_text}
                    onChange={(e,i,v) =>  this.updateValue('device_type', v)  }
                    >
                    {
                        this.state.device_types && 
                        this.state.device_types.map( device_type => 
                            <MenuItem value={device_type.id} primaryText={ device_type.name} />
                        )
                    }
                </SelectField>
                <br/>
               

                <TextField 
                floatingLabelText="Serial Number" 
                value={this.state.serial_num}
                disabled={true}
                onChange={(e,v) =>  this.updateValue('serial_num', v) } /><br />

                <TextField 
                floatingLabelText="Description" 
                value={this.state.description}
                onChange={(e,v) =>  this.updateValue('description', v) } /><br />
              

                 <TextField 
                floatingLabelText="Location" 
                value={this.state.location}
                onChange={(e,v) =>  this.updateValue('location', v) } /><br />


                <TextField 
                floatingLabelText="Hardware Version" 
                value={this.state.hardware_version}
                onChange={(e,v) =>  this.updateValue('hardware_version', v) } /><br />
                <br/>
                
              {/* save and delete icons */}           
              <RaisedButton label="Save" 
                    primary={false} 
                    onClick={ () => this.createDeviceConfig() } 
                    style={{marginRight: 12 }}
                    disabled={ disableSaveButton }
                />
        
                <RaisedButton 
                    label="Delete"
                    disabled={ !this.isExistingDeviceConfig() }
                    primary={false}
                    onClick={ () => this.deleteDevice( this.deviceconfigid() )  }   //TODO this function will actually change the deleted column of the config to true, however it still shows up as in the DB? 
                />     
                   


            </div>
        );
    }
}
import React from 'react';
import {SelectField, MenuItem, RaisedButton, TextField} from 'material-ui';
import {api, urlFunctions, styles} from '../../../common'
import {Link} from 'react-router-dom';


export default class DeviceTypePage extends React.Component {

    constructor(props)  {
        super(props)

        this.state = {
            devicetype: {
                "id": null,
                "name": "",
                "description": "",
                "deleted": false
              },
            loaded: false,
            changed: false,
            device_name_err_text: null,
            device_desc_err_text: null,
            device_datecreated_err_text: null
        }
    }

    componentDidMount = () => this.fetchData();

    //Load the data
    fetchData = () => {
        //if we're altering an already existing experiment device, get the details of that experiment and the sensor details
        if (this.isExistingDeviceType()) {
            return api.DeviceType.getDeviceType( this.devicetypeid() )
                .then( devicetypedata => {
                    //set the details
                    devicetypedata = devicetypedata.data[0];
                    this.setState( {
                        devicetype: devicetypedata,
                        loaded: true  
                    } );
                });

        } else {
            this.setState( { loaded: true } )
        }

    }

    //if modifying an already existing experiment, get the id from the URL
    devicetypeid = () => this.props.match.params.id;
    isExistingDeviceType = () => this.props.match.params.id !== undefined;

    //create the device record before moving on to the next page
    createDeviceType = () => {
        if (this.isValid()) {
            let data = {
                name: this.state.devicetype.name,
                description: this.state.devicetype.description,
                date_created: this.state.devicetype.date_created
            };

            if (this.isExistingDeviceType()) {

                this.updateDatabase(data, () => {
                    this.setState({changed: false});
                });

            } else {
                //create the experiment
                api.DeviceType.create(data)
                .then( created => {
                    let devicetype_id = created.data[0].id;
                    this.props.history.replace('/admin/device_type/' + devicetype_id);
                });
            }
        }
    }

    //update the existing sensor record, if the user has changed
    updateDatabase = (state, callback) => {
        if (!this.state.changed) callback();

        this.setState(state, () => {
            //update the data on the database. TODO: need to be more clever about this to not update each time. pudate after 1 seonc of no user changes. etc
            if(this.isExistingDeviceType()) {
                api.DeviceType.update(this.devicetypeid(), state  )
                .then( res => {
                    callback();
                });
            }
        });
    }

    //validation check on user input
    isValid = () => {
        let valid = true;
        let errors = {device_desc_err_text: null, device_name_err_text: null, device_datecreated_err_text: null}

        if (this.state.devicetype.name === "") {
            errors.device_name_err_text = "Please enter a name";
            valid = false;
        }

        if (this.state.devicetype.description == "" || this.state.description == "") {
            errors.device_desc_err_text = "Please enter a description";
            valid = false;
        }

        this.setState( errors );
        return valid;
    }


    //update the state with the new value
    updateValue = (name, value) => {
        const  state = {
            devicetype: {
                ...this.state.devicetype,
                [name]: value,
            },
            changed: true
        };
        this.setState(state);
    }

    render() {
        if (!this.state.loaded)
            return "";

        const disableSaveButton = !this.state.changed || !(this.state.changed || this.isExistingDeviceType());

        return ( 
            <div>
               

                <TextField 
                floatingLabelText="Device type name" 
                value={this.state.devicetype.name}
                onChange={(e,v) =>  this.updateValue('name', v) } 
                errorText={this.state.device_name_err_text}/><br />




                <TextField 
                floatingLabelText="Desciption" 
                value={this.state.devicetype.description}
                onChange={(e,v) =>  this.updateValue('description', v) }
                errorText={this.state.device_desc_err_text} /><br />



            

                {/* save and delete icons */}           
                <RaisedButton label="Save" 
                    primary={false} 
                    onClick={ () => this.createDeviceType(false) } 
                    style={{marginRight: 12 }}
                    disabled={ disableSaveButton }
                />
        
                <RaisedButton 
                    label="Delete"
                    disabled={ !this.isExistingDeviceType() }
                    primary={false}

                    onClick={ () => {
                        api.DeviceType.delete( this.devicetypeid() )
                        .then( () => {
                            this.props.history.push('/admin/devicetype_list');
                        });
                    }}

                />     


            </div>
        );
    }
}
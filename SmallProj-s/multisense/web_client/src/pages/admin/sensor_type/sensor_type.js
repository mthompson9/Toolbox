import React from 'react';
import {SelectField, MenuItem, RaisedButton, TextField} from 'material-ui';
import {api, urlFunctions, styles} from '../../../common'
import {Link} from 'react-router-dom';


export default class SensorTypePage extends React.Component {

    constructor(props)  {
        super(props)

        this.state = {
            sensortype: {
                "id": null,
                "name": "",
                "description": "",
                "unit": "",
                "deleted": false
              },
            loaded: false,
            changed: false
        }
    }

    componentDidMount = () => this.fetchData();

    //Load the data
    fetchData = () => {
        //if we're altering an already existing experiment device, get the details of that experiment and the sensor details
        if (this.isExistingSensorType()) {
            return api.SensorType.getSensorType( this.sensortypeid() )
                .then( sensortypedata => {
                    //set the details
                    sensortypedata = sensortypedata.data[0];
                    this.setState( {
                        sensortype: sensortypedata,
                        loaded: true  
                    } );
                });

        } else {
            this.setState( { loaded: true } )
        }

    }

    //if modifying an already existing experiment, get the id from the URL
    sensortypeid = () => this.props.match.params.id;
    isExistingSensorType = () => this.props.match.params.id !== undefined;

    //create the device record before moving on to the next page
    createSensorType = () => {
        let data = {
            name: this.state.sensortype.name,
            description: this.state.sensortype.description,
            unit: this.state.sensortype.unit
            
        };

        if (this.isExistingSensorType()) {
            this.updateDatabase(data, () => {
                this.setState({changed: false});
            });

        } else {
            //create the experiment
            api.SensorType.create(data)
            .then( created => {
                let sensortype_id = created.data[0].id;
                this.props.history.replace('/admin/sensor_type/' + sensortype_id);
            });
        }
    }

    //update the existing sensor record, if the user has changed
    updateDatabase = (state, callback) => {
        if (!this.state.changed) callback();

        this.setState(state, () => {
            //update the data on the database. TODO: need to be more clever about this to not update each time. pudate after 1 seonc of no user changes. etc
            if(this.isExistingSensorType()) {
                api.SensorType.update(this.sensortypeid(), state  )
                .then( res => {
                    callback();
                });
            }
        })
    }


    //update the state with the new value
    updateValue = (name, value) => {
        const  state = {
            sensortype: {
                ...this.state.sensortype,
                [name]: value,
            },
            changed: true
        };
        this.setState(state);
    }

    render() {
        if (!this.state.loaded)
            return "";

        const disableSaveButton = !this.state.changed || !(this.state.changed || this.isExistingSensorType());

        return ( 
            <div>
               

                <TextField 
                floatingLabelText="Sensor type name" 
                value={this.state.sensortype.name}
                onChange={(e,v) =>  this.updateValue('name', v) } /><br />

                <TextField 
                floatingLabelText="Desciption" 
                value={this.state.sensortype.description}
                onChange={(e,v) =>  this.updateValue('description', v) } /><br />

                <TextField 
                floatingLabelText="Unit" 
                value={this.state.sensortype.unit}
                onChange={(e,v) =>  this.updateValue('unit', v) } /><br />

                <RaisedButton label="Save" 
                    primary={false} 
                    onClick={ () => this.createSensorType(false) } 
                    style={{marginRight: 12 }}
                    disabled={ disableSaveButton }
                />
        
                <RaisedButton 
                    label="Delete"
                    disabled={ !this.isExistingSensorType() }
                    primary={false}

                    onClick={ () => {
                        api.SensorType.delete( this.sensortypeid() )
                        .then( () => {
                            this.props.history.push('/admin/sensortype_list');
                        });
                    }}

                />     


            </div>
        );
    }
}
import React from 'react';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import DevicesTable from './devices_table';
import SaveIcon from 'material-ui/svg-icons/content/save';
import DeleteIcon from 'material-ui/svg-icons/content/clear';
import {Checkbox, IconButton, TextField, RaisedButton, MenuItem, SelectField} from 'material-ui';
import {red500, yellow500, blue500} from 'material-ui/styles/colors';
import {api, urlFunctions, styles} from '../../../common'
import {Link} from 'react-router-dom';


import {
    Table,
    TableBody,
    TableHeader,
    TableHeaderColumn,
    TableRow,
    TableRowColumn,
  } from 'material-ui/Table';

//Create a new experiment record
export default class CreateExperiment extends React.Component {

    constructor(props)  {
        super(props)

        this.state = {
            value: "",
            loaded: false,
            user_id: -1,
            name: "Experiment " + (new Date()).toLocaleDateString(),
            name_error_text: null,
            user_id_error_text: null,
            exp_details: { //example data
                "id": 1,
                "name": "test exp",
                "user_id": 1,
                "description": "desc",
                "date_created": "2018-03-06T00:25:30.918043",
                "finished": false,
                "deleted": true,
                "user": {
                    "id": 1,
                    "name": "test user",
                    "email": "user@place.com",
                    "date_created": "2018-03-06T00:25:30.916704",
                    "deleted": false
                },
                "experiment_device": [
                    {
                    "id": 1,
                    "exp_id": 1,
                    "device_config_id": 1,
                    "name": "my pi",
                    "date_created": "2018-03-06T00:25:30.919346",
                    "deleted": false,
                    "device_config": {
                        "id": 1,
                        "device_type_id": 1,
                        "description": "a test device",
                        "serial_num": "PI1234",
                        "location": "JH",
                        "hardware_version": "v1",
                        "comment": "comment",
                        "date_created": "2018-03-06T00:25:30.899501",
                        "deleted": false
                    }
                    }
                ]
            },
            description: "",
            description_error_text: null,
            finished: false,
            changed: false
        }
    }

    componentDidMount = () => {
        (async () => {
            this.fetchData();
        })();
    }

    //get the lookup values, and get the experiment details (if this is an existing experiment)
    fetchData = async () => {
        const users = await api.User.getUsers();
        this.setState( {user_details: users.data} );

        //if we're altering an already existing experiment, get the details of that experiment
        if (this.isExistingExperiment()) {
            const exp = await api.Experiment.getExperiment(this.experimentId());
            const exp_data = exp.data[0];
            this.setState( {user_id: exp_data.user.id, name:exp_data.name, 
                exp_details:exp_data, description: exp_data.description, finished: exp_data.finished,  loaded: true } );

        } else {
            this.setState( {loaded: true } );
        }
    

        // api.User.getUsers()
        // .then(users => {
        //     this.setState( {user_details: users.data} );

        //     //if we're altering an already existing experiment, get the details of that experiment
        //     if (this.isExistingExperiment()) {
        //         return api.Experiment.getExperiment(this.experimentId())
        //             .then( exp => {
        //                 exp = exp.data[0];
        //                 this.setState( {user_id: exp.user.id, name:exp.name, exp_details:exp, description: exp.description, finished: exp.finished,  loaded: true } );
        //             });
        //     } else {
        //         this.setState( {loaded: true } )
        //     }
        // });
    }

    //if modifying an already existing experiment, get the id from the URL
    experimentId = () => this.props.match.params.id;
    isExistingExperiment = () => this.props.match.params.id !== undefined;

    //create the device record before moving on to the next page
    createExperiment = (moveNext=true) => {
        if (!this.isValid()) return;

        let data = {name: this.state.name, user_id: this.state.user_id, description: this.state.description, finished: this.state.finished };

        //add device to existinf experiment
        if (this.isExistingExperiment()) {
            //if existing, them update the existing table
            this.updateDatabase(data, () => {

                if (moveNext)
                    this.props.history.push('/admin/experiment_device?exp_id=' + this.experimentId());
                else
                    this.setState({changed: false});
            });

        } else {
            //create the experiment 
            api.Experiment.create(data)
            .then( created => {
                let exp_id = created.data[0].id;

                //alter the current url so that if the user goes back to it then it loads the one we just created
                this.props.history.replace('/admin/experiment/' + exp_id);
                if (moveNext)
                    this.props.history.push('/admin/experiment_device?exp_id=' + exp_id);

            });
        }
    }

    updateDatabase = (state, callback) => {
        if (!this.state.changed) callback();

        this.setState(state, () => {
            //update the data on the database. TODO: need to be more clever about this to not update each time. pudate after 1 seonc of no user changes. etc
            if(this.isExistingExperiment()) {
                api.Experiment.update(this.experimentId(), state)
                .then( () => {
                    callback();
                });
            }
        })
    }

    //validation check on user input
    isValid = () => {
        let valid = true;
        let errors = {name_error_text: null, user_id_error_text: null}

        if (this.state.name === "") {
            errors.name_error_text = "Please enter a name";
            valid = false;
        }

        if (this.state.user_id == -1) {
            errors.user_id_error_text = "Please select a user";
            valid = false;
        }

        if (this.state.description == null || this.state.description == "") {
            errors.description_error_text = "Please enter a description";
            valid = false;
        }

        this.setState( errors );
        
        return valid;
    }

    //will update the database as soon as the user changes the data (if this is an existing record)
    updateValue = (name, value) => {
        const  state = {[name]: value, changed: true};
        this.setState(state);
    }

    render() {
        const disableSaveButton = !this.state.changed || !(this.state.changed || this.isExistingExperiment());
        
        //disable all the buttons if the experiment is finished, but dont disable the buttons if the user has just clicked the check box, wait until the user has saved the record
        const disabled = this.state.finished && !this.state.changed;

        if (!this.state.loaded )
            return "";

        let devices_table = "";
        if (this.isExistingExperiment() && this.state.exp_details.experiment_device.length > 0 ) {
            devices_table = <div>
                Devices: <br/>
                <DevicesTable 
                experiment_devices={this.state.exp_details.experiment_device} 
                onSelection={ (exp_dev_id) => 
                    this.props.history.push('/admin/experiment_device/' + exp_dev_id)  
                }
                /></div>
        };
        
        return (<div>
            <Link to={"/experiment_list"}>&lt; Back to experiment list</Link>
                            
            <br/> 
            <TextField 
                floatingLabelText="Experiment Name" 
                value={this.state.name}
                errorText={this.state.name_error_text}
                disabled={disabled}
                onChange={(e,v) =>  this.updateValue('name', v) } /><br />

            <TextField
                floatingLabelText="Description"
                value={this.state.description}
                disabled={disabled}
                errorText={this.state.description_error_text}
                onChange={(e,v) => this.updateValue('description', v)}
            />
            <br />

        
            <SelectField
                floatingLabelText="User"
                value={this.state.user_id}
                disabled={disabled}
                errorText={this.state.user_id_error_text}
                onChange={ (e,i, v) => this.updateValue('user_id', v) }
                >
                {
                    this.state.user_details.map( user => 
                        <MenuItem  key={user.id} value={user.id}  primaryText={user.name} />
                    )
                }
            </SelectField>

            <br/>
            <Checkbox
                label="Experiment complete"
                checked={this.state.finished}
                disabled={disabled}
                onCheck={ (e,v) => this.updateValue('finished', v) }                
            />
            
            <br/><br/>            
            {devices_table}         

            <RaisedButton label="Add device to experiment" 
                primary={true} 
                disabled={disabled}
                onClick={ () =>  this.createExperiment()  } 
                style={{marginRight: 12 }}
            />

            {/* save and delete icons */}           
            <RaisedButton label="Save" 
                primary={false} 
                onClick={ () => this.createExperiment(false) } 
                style={{marginRight: 12 }}
                disabled={ disabled || disableSaveButton }
            />
     
            <RaisedButton 
                label="Delete"
                disabled={ !this.isExistingExperiment() || this.state.exp_details.deleted}
                onClick={ () => {
                    api.Experiment.delete( this.experimentId() )
                    .then( () => {
                        this.props.history.push('/experiment_list');
                    });
                }}
                primary={false}
            />           
       

        </div>);
    }

}



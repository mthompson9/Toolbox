import React from 'react';
import {SelectField, MenuItem, RaisedButton, TextField} from 'material-ui';
import {api, urlFunctions, styles} from '../../../common'
import {Link} from 'react-router-dom';
const bcrypt = require ('bcryptjs'); 


export default class UserPage extends React.Component {

    constructor(props)  {
        super(props)

        this.state = {
            user: {
                "id": null,
                "name": "",
                "email": "",
                "password": "",
                "date_created": "2018-03-08T15:03:36.715276",
                "deleted": false
              },
            loaded: false,
            changed: false,
            duplicate: false,
            count: 0,
        }
    }

    componentDidMount = () => this.fetchData();

    //Load the data
    fetchData = () => {
        if (sessionStorage.getItem('CurrentUser') == undefined) {
            this.props.history.push('/admin/login')
        }
        //if we're altering an already existing experiment device, get the details of that experiment and the sensor details
        if (this.isExistingUser()) {
            return api.User.getUser( this.experimentUserId() )
                .then( userdata => {
                    //set the details
                    userdata = userdata.data[0];
                    this.setState( {
                        user: userdata,
                        loaded: true  
                    } );
                });
        } else {
            api.User.getUsers()
            .then( users => {
                users = users.data
                this.setState({
                    AllUsers: users
                })
            })
          
            this.generatePass();
            this.setState( { loaded: true } );
        }

    }

    // sendEmail = (email, username, password) => { 
    //    let nodemailer = require('nodemailer');
    //    let gmail = require('gmail'); 
    //    let link = 'http://localhost:3006/admin/user'
    //    const ourEmail = 'templogger9@gmail.com';
    //    const emailPassword = 'ThinkBig';
    //    const transporter = nodemailer.createTransport('smtps://' + ourEmail + ':' + emailPassword + '@smtp.gmail.com');
    //    let message = 'Hi ' + username + ','  + 'A new account has been created for you at ' + link  + '.' +
    //    'Please sign in at the link above.'  +
    //    'Username: ' + username  + 
    //    'Password: ' + password;

    //    let mail_options = {
    //        from: [ourEmail],
    //        to: email,
    //        subject: 'Multisensor Account Created',
    //        text: message
    //    }

    //    transporter.sendMail(mail_options, null)
    //    window.alert('email sent to ' + email + '.')

    // }

    



    //if modifying an already existing experiment, get the id from the URL
    experimentUserId = () => this.props.match.params.id;
    isExistingUser = () => this.props.match.params.id !== undefined;

    //create the device record before moving on to the next page
    createUser = () => {
        if (this.isValid()){
            let data = {    
            name: this.state.user.name,
            email: this.state.user.email,
            password: this.state.user.HashedPass
            };

        if (this.isExistingUser()) {
            this.updateDatabase(data, () => {
                this.setState({changed: false});
            });

        } else {
            //create the experiment
            
            if (this.state.email != "" && this.state.name != "" && !this.duplicateUser(this.state.user.email, this.state.user.name)){
            api.User.create(data)
            .then( created => {
                let user_id = created.data[0].id;
                this.props.history.replace('/admin/user/' + user_id);
            });
        }
        }}
        
    }


    duplicateUser = (email, username) => {
        this.state.AllUsers.forEach( user => { 
            if (user.email == email){
                // window.alert('This username/email is already registered. \n Please try again with different credentials') Simon Didn't want the window alert. 
                this.setState({
                        user_email_err_text: "This Email address has already been registed. Please try a different or login to your account"
                })
                this.state.duplicate = true;
            }
            if (user.name == username){
                // window.alert('This username/email is already registered. \n Please try again with different credentials') Simon Didn't want the window alert. 
                this.setState({
                        user_name_err_text: "This Username has already been registed. Please try a different or login to your account"
                })
                this.state.duplicate = true;
            }
        })
        return this.state.duplicate
    }


    //update the existing sensor record, if the user has changed
    updateDatabase = (state, callback) => {
        if (!this.state.changed) callback();

        this.setState(state, () => {
            //update the data on the database. TODO: need to be more clever about this to not update each time. pudate after 1 seonc of no user changes. etc
            if(this.isExistingUser()) {
                api.User.update(this.experimentUserId(), state  )
                .then( res => {
                    callback();
                });
            }
        })
    }
    
    //validation check on user input
    isValid = () => {
        let regEx = /\W/
        let valid = true;
        let errors = {user_name_err_text: null, user_email_err_text: null}

        if (this.state.user.name === "" || (this.state.user.name.match(regEx) != null) && this.state.user.name.match(regEx) != ' ' || this.state.user.name.length < 1){
            
            errors.user_name_err_text = "Please enter a name";
            valid = false;
            
        }

     regEx = /@/g

        if (this.state.user.email == "" || this.state.user.email.match(regEx) == null || (this.state.user.email.match(regEx).length > 1) || !this.state.user.email.includes('.', '@')) {
            errors.user_email_err_text = "Please enter a valid Email address";
            valid = false;
        }

        regEx = /.@/g

        if (this.state.user.email.match(regEx) == null) {
            errors.user_email_err_text = "Please enter a valid Email address";
            valid = false;
        }


        this.setState( errors );
        return valid;
    }

 





    generatePass = () => { 
        const saltRounds = 10;
        const passwordArr =[0,1,2,3,4,5,6,7,8,9];
        let pass = '';
        for (var i=0; i < 5; ++i){
            let nextDigit = Math.floor(Math.random() * 10);
            pass = pass + passwordArr[nextDigit];
        }

        this.setState({ 
            raw_pass: pass,
            changed: false
        });

        bcrypt.hash(pass, 8)
        .then( pass => { 
            this.updateValue('HashedPass', pass)
        });
    }

    //update the state with the new value
    updateValue = (name, value) => {
        const  state = {
            user: {
                ...this.state.user,
                [name]: value,
            },
            changed: true
        };
        this.setState(state);
    }

    render() {

        


        if (!this.state.loaded)
            return "";

        const disableSaveButton = !this.state.changed || !(this.state.changed || this.isExistingUser());

        return ( 
            <div style={{padding: 25, paddingTop: 25}}>
               

                <TextField 
                floatingLabelText="User name" 
                value={this.state.user.name}
                onChange={(e,v) =>  this.updateValue('name', v) }
                errorText={this.state.user_name_err_text} /><br />

                <br/>

                <TextField 
                floatingLabelText="Email" 
                value={this.state.user.email}
                onChange={(e,v) =>  this.updateValue('email', v) } 
                errorText={this.state.user_email_err_text} /><br />

                <br/>

                <TextField 
                floatingLabelText="Password" 
                value={this.state.raw_pass + ' - Note this before saving'}
                disabled={true}
                errorText={this.state.user_password_err_text} /><br />

                <br/>

                {/* save and delete icons */}           
                <RaisedButton label="Save" 
                    primary={false} 
                    onClick={ () => this.createUser(false) } 
                    style={{marginRight: 12 }}
                    disabled={ disableSaveButton }
                />
        
                <RaisedButton 
                    label="Delete"
                    disabled={ !this.isExistingUser() }
                    primary={false}

                    onClick={ () => {
                        api.User.delete( this.experimentUserId() )
                        .then( () => {
                            this.props.history.push('/admin/user_list');
                        });
                    }}

                />     


            </div>
        );
    }
}



//I want to change it so that users can edit their password once logged in. 
//as well as complete more testing and fix more bugs but I've been instructed to cease work 
//on this project almost immediately (half an hour). 
//Password hashing, retrieval, decryption & comparison does work though. 
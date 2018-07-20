import React from 'react';
import {SelectField, MenuItem, RaisedButton, TextField} from 'material-ui';
import {api, urlFunctions, styles} from '../../../common'
import {Link} from 'react-router-dom';

// import bcrypt for our comparison
const bcrypt = require ('bcryptjs'); 


export default class LoginForm extends React.Component {

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
            loaded: true,
            changed: false,
            logged_in: false,
            errors: {}
        }
    }



    // I think we can get rid of the fetchData function here and complete effectiely the same task at the same time as this.login(email, password) 
    // //Load the data
    // fetchData = async (email) => {
    //         let user = await api.User.getThisUser(email)
    //             user = user.data;
    //             console.log(users)
    //             this.setState({
    //                 ThisUser: user
    //             })

    //         this.setState( { loaded: true } )
        

    // }


    // isExistingUser = (email) => { 

    // }

    // //create the device record before moving on to the next page
    // createUser = () => {
    //     if (this.isValid()){
    //         let data = {
    //         name: this.state.user.name,
    //         email: this.state.user.email,
    //         password: this.state.user.password
    //         };

    //     if (this.isExistingUser()) {
    //         this.updateDatabase(data, () => {
    //             this.setState({changed: false});
    //         });

    //     } else {
    //         //create the experiment
    //         if (this.state.email != "" && this.state.name != "") {
    //         api.User.create(data)
    //         .then( created => {
    //             let user_id = created.data[0].id;
    //             this.props.history.replace('/admin/user/' + user_id);
    //         });
    //         window.alert('Email: ' + this.state.user.email + ' || Username: ' + this.state.user.name + ' || Pass: ' + this.state.user.password)
    //     }
    //     }}
        
    // }

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
    

    login = async (username, password) => {
        // Get this specific user record - even if it doesnt exist, return empty array
        api.User.getThisUser(username)
        .then( thisUser_raw => {
            let thisUser = thisUser_raw.data; 
            thisUser = thisUser[0];
            
            let passValid = false;
            let nameValid = false;
            let logged_in =false;
            let this_user_id = '';
            let errors = {username_err_text: null, password_err_text: null};

            if (thisUser != undefined) {
                nameValid = true;
                passValid = null;

              

                // if plainText password = unhashed password from db
                if ( thisUser.password != null || bcrypt.compare(thisUser.password, password)) {
                    passValid = true;
                    this_user_id = thisUser.id;
                }
            }

            if (nameValid != true) { 
                errors.username_err_text = 'This username is incorrect, please check and try again.';
            }

            if (passValid != true) { 
                errors.password_err_text = 'This username & password combination is wrong, please check and try again.';
            }

            this.setState(errors)
            // only have to check pass because it wont be true unless username is also true
            if (passValid == true) {
                sessionStorage.setItem('CurrentUser', this_user_id);

                sessionStorage.setItem('UserName', username);
                // window.alert('Your user ID is : ' + this_user_id) //for testing of future segregation of data
                this.props.history.replace('/experiment_list/' + this_user_id);
            }
        }); 
    };



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
    };

    render() {

        


        if (!this.state.loaded)
            return "";

        const disableLoginButton = !this.state.changed

        return ( 
            <div>
               

                <TextField
                style={{justifyContent:'center'}} 
                floatingLabelText="Username" 
                value={this.state.user.name}
                onChange={(e,v) =>  this.updateValue('name', v) }
                errorText={this.state.username_err_text} /><br />

                <br/>

                <TextField
                style={{justifyContent:'center'}} 
                floatingLabelText="Password" 
                value={this.state.user.password}
                onChange={(e,v) =>  this.updateValue('password', v) }
                errorText={this.state.password_err_text} /><br />

                <br/>

                {/* save and delete icons */}           
                <RaisedButton label="Login"
                style={{justifyContent:'center'}} 
                    primary={false} 
                    onClick={ () => this.login(this.state.user.name, this.state.user.password) } 
                    
                    disabled={ disableLoginButton }
                />
        
 


            </div>
        );
    }
}
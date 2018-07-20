import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import 'typeface-roboto'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import {Drawer, MenuItem, AppBar} from 'material-ui';

import {DisplayMeasurements, DeviceConfigTable, ExperimentList, 
  UserList, CreateExperiment, ExperimentDevice, 
  ExperimentSensor, SensorConfig, UserPage, DeviceConfigList,  SensorTypePage, SensorTypeList,}
  from './pages'

import {withRouter} from "react-router-dom";
import DeviceTypePage from './pages/admin/device_type/device_type';
import DeviceTypeList from './pages/admin/device_type/devicetype_list';
import LoginForm from './pages/admin/user/login'
import { api } from './common/'

import SensorConfigList from './pages/admin/sensor_config/sensor_config_list';


import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'




//slide out drawer that get displayed when the user clicks on the hamburger menu button
export class SideDraw extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username : 'Placeholder'
    }
  }


  setNewPage = (page) => {
    this.props.history.push(page);
    this.props.clickHandle();
  }

  logout = () => {
    sessionStorage.removeItem('UserName');
    sessionStorage.removeItem('CurrentUser')
    this.setNewPage('/admin/login');
  }


  render() {
    return <Drawer
            docked={false}
            width={200}
            open={this.props.open}
            onRequestChange={(open) => this.props.clickHandle() }
          >
            {/* will add onclick funcitonality to this item that takes you to the user account management page (we will need it if we have teams/permissions etc) */}
            <MenuItem>{sessionStorage.getItem('UserName')}</MenuItem> 
            <hr/>
            <MenuItem onClick={() => this.setNewPage("/experiment_list") }>Experiments</MenuItem>
            <MenuItem onClick={() =>  this.setNewPage("/admin/experiment") }>Create experiment</MenuItem>
            <MenuItem onClick={() =>  this.setNewPage("/admin/sensor_config_list") }>Sensors</MenuItem>
            <MenuItem onClick={() =>  this.setNewPage("/admin/device_config_list") }>Devices</MenuItem>

            <hr/>
            <MenuItem onClick={() =>  this.setNewPage("/admin/user_list") }>Users</MenuItem>

            <MenuItem onClick={() =>  this.setNewPage("/admin/devicetype_list") }>Device Types</MenuItem>
            <MenuItem onClick={() =>  this.setNewPage("/admin/sensortype_list") }>Sensor Types</MenuItem>

            <hr/>

            {/* targetOrigin styling not working here? Ive had problems when trying to specify styles of different things on the site. I feel there is an overriding styler that im not aware of */}
            <MenuItem targetOrigin={{horizontal: 'left', vertical: 'bottom'}} onClick={this.logout.bind()}>Logout</MenuItem>
            
    </Drawer>
  }
}

const SideDrawRouted = withRouter(SideDraw)

//App bar shows at the top of the page
const MultiSenseAppBar = (props) => (
  <div>
    <AppBar
      title="Multi Sense"
      showMenuIconButton={true}
      iconClassNameRight="muidocs-icon-navigation-expand-more"
      onLeftIconButtonClick={() => { props.onClick() }}
    >
    </AppBar> 
  </div>
)

//The main application
class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      open: false
    }
  }


  render() {

      //if user isn't logged on, and we're not on the login page, redirecto to logon page
      if (sessionStorage.getItem('CurrentUser') == undefined) {
        if (!window.location.toString().endsWith('/admin/login') ) {
          this.props.history.push('/admin/login');
        }    
      }


    return (
    
        <MuiThemeProvider>
          <div  >
            
            <MultiSenseAppBar  onClick={ () => this.setState({open: true}) } />

            <SideDrawRouted open={this.state.open} 
              history={this.props.history}
              clickHandle={() => this.setState({open: false}) } />


            <div  style={{padding: "20px"}}>

              {/* Route specification of where to go for each URL */}
              <Route exact path="/" exact render={ (props) => <ExperimentList {...props} />  } />
              <Route exact path="/display_experiment/:id" exact render={ (props) => <DisplayMeasurements {...props} />  } />

              {/* Admin */}
              <Route exact path="/admin/device_configs" exact render={ (props) => <DeviceConfigTable {...props} />  } />
              <Route exact path ="/admin/device_configs/:id" exact render={(props) => <DeviceConfigTable {...props}/>} />

              <Route exact path="/admin/device_config_list" exact render={ (props) => <DeviceConfigList {...props} />  } />


              <Route exact path="/experiment_list" exact render={ (props) => <ExperimentList {...props} />  } />
              <Route exact path="/experiment_list/:id" exact render={ (props) => <ExperimentList {...props} />  } />

              <Route exact path="/admin/experiment/:id" exact render={ (props) => <CreateExperiment {...props} />  } />
              <Route exact path="/admin/experiment" exact render={ (props) => <CreateExperiment {...props} />  } />

              <Route exact path="/admin/experiment_device/:id" exact render={ (props) => <ExperimentDevice {...props} />  } />
              <Route exact path="/admin/experiment_device" exact render={ (props) => <ExperimentDevice {...props} />  } />
 
              <Route exact path="/admin/experiment_sensor" exact render={ (props) => <ExperimentSensor {...props} />  } />
              <Route exact path="/admin/experiment_sensor/:id" exact render={ (props) => <ExperimentSensor {...props} />  } />

              <Route exact path="/admin/sensor_config_list" exact render={ (props) => <SensorConfigList {...props} />  } />
              <Route exact path="/admin/sensor_config_new/:id" exact render={ (props) => <SensorConfig {...props} />  } />
              <Route exact path="/admin/sensor_config_new/" exact render={ (props) => <SensorConfig {...props} />  } />

            <Route exact path="/admin/user" exact render={(props) => <UserPage {...props} /> } />
            <Route exact path ="/admin/user/:id" exact render={(props) => <UserPage {...props}/>} />
            <Route exact path="/admin/login" exact render={(props) => <LoginForm {...props} /> } />
            
            <Route exact path="/admin/user_list" exact render={(props) => <UserList {...props} /> } />
            
            <Route exact path="/admin/device_type" exact render={(props) => <DeviceTypePage {...props} /> } />
            <Route exact path="/admin/device_type/:id" exact render={(props) => <DeviceTypePage {...props} /> } />            
            <Route exact path="/admin/devicetype_list" exact render={(props) => <DeviceTypeList {...props} /> } />
            
            <Route exact path="/admin/sensor_type" exact render={(props) => <SensorTypePage {...props} /> } />
            <Route exact path="/admin/sensor_type/:id" exact render={(props) => <SensorTypePage {...props} /> } />            
            <Route exact path="/admin/sensortype_list" exact render={(props) => <SensorTypeList {...props} /> } />

            

            </div>
          </div>
        </MuiThemeProvider>

    );
  }
}

export default App;

import React from 'react';

import {RaisedButton, FlatButton} from 'material-ui';
import axios from 'axios';
import {withRouter} from "react-router-dom";
import EditIcon from 'material-ui/svg-icons/editor/mode-edit';
import {red500, yellow500, blue500} from 'material-ui/styles/colors';
import {api, urlFunctions, styles} from '../../../common'


import {
    Table,
    TableBody,
    TableHeader,
    TableHeaderColumn,
    TableRow,
    TableRowColumn,
  } from 'material-ui/Table';

const style = {
    margin: 12,
};


class DeviceTypeList extends React.Component {


    constructor(props) {
        super(props);
    
        this.state = {
            loaded: false,
            experiments: [],
            editButtonPressed: false
        }
      }
    
      //on load get the latest
      componentDidMount() {
       this.refresh();
      }
    

      refresh() {
        api.DeviceType.getDeviceTypes()
        .then(res => {
            this.setState( { DeviceTypes: res.data, loaded:true  } )
        });
      }
    
      selectedEdit = (exp_id) => {
        this.state.editButtonPressed = true;
        this.props.history.push("/admin/device_type/" + exp_id);
      }
    
      render() {
        var table = [];
    
        if (this.state.loaded) {
    
            var rows = this.state.DeviceTypes.map( (item) => 
                <TableRow key={item.id}  >
                    <TableRowColumn>
                    <EditIcon  color={blue500}  hoverColor={yellow500} onClick={ () => this.selectedEdit(item.id)  } />
    

                    </TableRowColumn>
                    <TableRowColumn>{item.name}</TableRowColumn>
                    <TableRowColumn>{item.description}</TableRowColumn>
                    <TableRowColumn>{item.date_created}</TableRowColumn>
                    
                    
                </TableRow>
            );
    
            var table = (
                <Table >
                <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                    <TableRow>                    
                        <TableHeaderColumn>
                        </TableHeaderColumn>
                        <TableHeaderColumn>Device Type</TableHeaderColumn>
                        <TableHeaderColumn>Description</TableHeaderColumn>
                        <TableHeaderColumn>Date Created</TableHeaderColumn>

                    </TableRow>
                </TableHeader>
    
                <TableBody displayRowCheckbox={false}                
                    deselectOnClickaway={true}
                    showRowHover={true}
                    stripedRows={false}>
                    {rows}
                </TableBody>
                </Table>
            );
        }
    
        return (
          <div>{table}
          <RaisedButton label="Create" primary={true} style={style} onClick={ () => this.props.history.push("/admin/device_type")  } />
          </div>
        );
      }
    
    }
    
export default withRouter(DeviceTypeList);

import React from 'react';

import {RaisedButton, FlatButton} from 'material-ui';
import axios from 'axios';
import {withRouter} from "react-router-dom";
import EditIcon from 'material-ui/svg-icons/editor/mode-edit';
import {red500, yellow500, blue500} from 'material-ui/styles/colors';
import * as api from '../../common/api'

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

// A table of all the experiments available
class ExperimentList extends React.Component {

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
      let currentId = sessionStorage.getItem('CurrentUser');
    //   window.alert(currentId)
      if (currentId != null){ 
        //   window.alert('here');
        this.props.history.replace('/experiment_list/' + currentId);
      }
    if (this.isLoggedIn()){
        api.Experiment.getUserExperiments(this.userId())
        .then( res => { 
            this.setState({ 
                experiments: res.data, loaded:true
            })
        })
    } else {
        api.Experiment.getAllExperiments()
        .then(res => {
            this.setState( { experiments: res.data, loaded:true  } )
        });
    }
  }

  selectedRow = (rowIndex) => {
    if (!this.state.editButtonPressed)
        this.props.history.push("/display_experiment/" + this.state.experiments[rowIndex].id);
  }

  selectedEdit = (exp_id) => {
    this.state.editButtonPressed = true;
    this.props.history.push("/admin/experiment/" + exp_id);
  }

  userId = () => this.props.match.params.id;
  isLoggedIn = () => this.props.match.params.id !== undefined;

  render() {
    var table = [];

    if (this.state.loaded) {

        var rows = this.state.experiments.map( (item) => 
            <TableRow key={item.id}  >
                <TableRowColumn>
                <EditIcon  color={blue500}  hoverColor={yellow500} onClick={ () => this.selectedEdit(item.id)  } />

                </TableRowColumn>
                <TableRowColumn>{item.name}</TableRowColumn>
                <TableRowColumn>{item.user.name}</TableRowColumn>
                <TableRowColumn>{item.date_created}</TableRowColumn>
                
            </TableRow>
        );

        var table = (
            <Table onRowSelection={ (selectedIndexesArr) => this.selectedRow(selectedIndexesArr[0]) }>
            <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                <TableRow>                    
                    <TableHeaderColumn>
                    </TableHeaderColumn>
                    <TableHeaderColumn>Name</TableHeaderColumn>
                    <TableHeaderColumn>User</TableHeaderColumn>
                    <TableHeaderColumn>Date</TableHeaderColumn>
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
      <RaisedButton label="Create" primary={true} style={style} onClick={ () => this.props.history.push("/admin/experiment")  } />
      </div>
    );
  }

}

export default withRouter(ExperimentList);


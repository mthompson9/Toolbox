import React from 'react';
import {MenuItem, RaisedButton, TextField, SelectField} from 'material-ui';
import axios from 'axios';
import {
    Table,
    TableBody,
    TableHeader,
    TableHeaderColumn,
    TableRow,
    TableRowColumn,
  } from 'material-ui/Table';

export default class DevicesTable extends React.Component {

    constructor(props)  {
        super(props)
    }

    selectedRow = (index) => {
        if (index === undefined) return;
        
        let id = this.props.experiment_devices[index].id;
        this.props.onSelection(id);
    }

    render() {
        return (
             <div style={{maxWidth: 300}}>
                    <Table onRowSelection={ (selectedIndexesArr) => this.selectedRow(selectedIndexesArr[0]) }>
                    <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                        <TableRow>                    
                            <TableHeaderColumn>Name</TableHeaderColumn>
                            <TableHeaderColumn>Serial</TableHeaderColumn>
                        </TableRow>
                    </TableHeader>

                    <TableBody displayRowCheckbox={false}                
                        deselectOnClickaway={true}
                        showRowHover={true}
                        stripedRows={false}>
                    
                        {
                            this.props.experiment_devices.map( device => 
                                <TableRow key={device.id}  >
                                    <TableRowColumn>{device.name}</TableRowColumn>
                                    <TableRowColumn>{device.device_config.serial_num}</TableRowColumn>
                                </TableRow>
                            )
                        }
                    </TableBody>
                    </Table>
                </div>
        );
    }

}



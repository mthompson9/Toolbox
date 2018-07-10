import React, { Component } from 'react';
import { MenuItem, TextField, withStyles, Typography, Card } from '@material-ui/core'

const styles = theme => ({
    center: {
        marginLeft: 'auto',
        marginRight: 'auto',
        width: '50%'
    },
    container: {
        display: 'flex',
        flexWrap: 'wrap',
        paddingTop: 100
      },
      textField: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
        width: 200,
        padding: 20
      },
      menu: {
        width: 200,
      },
      card: {
        height: 'auto',
        width: 700,
      },
});

const sizes = [
    {
        value: 'Small', 
        label : 'Small'
    },
    {
        value: 'Medium', 
        label : 'Medium'
    },
    {
        value: 'Large', 
        label : 'Large'
    },
];

const yeildSize = [
    {
        value: '2',
        label: '2 t/Ha', 
        dist: 'Ha'
    },
    {
        value: '5',
        label: '5 t/Ha',
        dist: 'Ha'
    }, 
    {
        value: '10',
        label: '10 t/Ha',
        dist: 'Ha'
    },
    {
        value: '15',
        label: '15 t/Ha',
        dist: 'Ha'
    },
    {
        value: '20',
        label: '20 t/Ha',
        dist: 'Ha'
    },
];

const fieldSizes = [ 
    {
        value: 5,
        label: '5 Ha'
    },
    { 
        value: 25,
        label: '25 Ha'
    }, 
    { 
        value: 50,
        label: '50 Ha'
    },
    { 
        value: 75, 
        label: '75 Ha'
    }
]

const weights = [ 
    {
        value: 5,
        label: '5t'
    },
    { 
        value: 25,
        label: '25t'
    }, 
    { 
        value: 50,
        label: '50t'
    },
    { 
        value: 75, 
        label: '75t'
    }
]

const plantDist = [ 
    {
        value: 0.5,
        label: '0.5m'
    },
    { 
        value: 0.75,
        label: '0.75m'
    }, 
    { 
        value: 1,
        label: '1m'
    },
    { 
        value: 1.5, 
        label: '1.5m'
    }
]

const crpMng = [ 
    {
        value: 'Passive',
    },
    { 
        value: 'Precision',
    }, 
    { 
        value: 'Agronomist',
    },
    { 
        value: 'Blanket', 
    }
]


const dataInput = [ 
    {
        value: 'Option',
    },
    { 
        value: 'Option',
    }, 
    { 
        value: 'Option',
    },
    { 
        value: 'Option', 
    }
]

class DrillingCard extends Component {
    state = {
        
    };

    handleChange = name => event => {
        this.setState({
          [name]: event.target.value,
        });
      };

      render () { 
          const { classes } = this.props
          return (
              <div className={classes.center}>
              <Card className={classes.card}>
              <div style={{width: 700, justifyContent: 'center', }}>
                  <div style={{padding: 20 }}>
                    <Typography variant="display1" align='left' style={{paddingTop: 20}}>
                        Seed & Field
                    </Typography>
                <TextField
                    id="seedSize"
                    select
                    helperText="Seed Size "
                    className={classes.textField}
                    value={this.state.seedSize}
                    onChange={this.handleChange("seedSize")}
                    >
                    {sizes.map(option => (
                        <MenuItem key={option.value} value={option.value}> 
                        {option.label}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    id="fieldSize"
                    select
                    helperText="Field Size"
                    className={classes.textField}
                    value={this.state.fieldSize}
                    onChange={this.handleChange("fieldSize")}
                    >
                    {fieldSizes.map(fieldSize => (
                        <MenuItem key={fieldSize.value} value={fieldSize.value}>
                        {fieldSize.label}
                        </MenuItem>
                    ))}
                </TextField>
                <br/>
                <TextField
                    id="weight"
                    select
                    helperText="Enter weight"
                    className={classes.textField}
                    value={this.state.weight}
                    onChange={this.handleChange("weight")}
                    >
                    {weights.map(weight => (
                        <MenuItem key={weight.value} value={weight.value}>
                        {weight.label}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    id="yieldSize"
                    select
                    helperText="Yield Size "
                    className={classes.textField}
                    value={this.state.yield}
                    onChange={this.handleChange("yield")}
                    >
                    {yeildSize.map(yieldSize => (
                        <MenuItem key={yieldSize.value} value={yieldSize.value}> 
                        {yieldSize.label}
                        </MenuItem>
                    ))}
                </TextField>
                <br/>
                <TextField
                    id="plantigDist"
                    select
                    helperText="Planting Distance"
                    className={classes.textField}
                    value={this.state.plantDist}
                    onChange={this.handleChange("plantDist")}
                    >
                    {plantDist.map(dist => (
                        <MenuItem key={dist.value} value={dist.value}> 
                        {dist.label}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    id="crpMng"
                    select
                    helperText="Crop Managment Method"
                    className={classes.textField}
                    value={this.state.crpMng}
                    onChange={this.handleChange("crpMng")}
                    >
                    {crpMng.map(choice => (
                        <MenuItem key={choice.value} value={choice.value}> 
                        {choice.value}
                        </MenuItem>
                    ))}
                </TextField>
                <br/>
                </div>
              </div>
              
              <br/>
              <br/>
              
              <div style={{ width: '100%', justifyContent: 'center', padding: 20}}>
                <Typography variant="display1" align='left' style={{paddingTop: 20}}>
                    Drilling dates
                </Typography>
                <TextField
                    id="drillDate"
                    label="Drilling Date"
                    type="date"
                    defaultValue="2018-05-24"
                    className={classes.textField}
                    InputLabelProps={{
                    shrink: true,
                    }}
                />
                <TextField
                    id="harvestDate"
                    label="Harvest Date"
                    type="date"
                    defaultValue="2018-05-25"
                    className={classes.textField}
                    InputLabelProps={{
                    shrink: true,
                    }}
                />
              </div>
              <div style={{ width: '100%', justifyContent: 'center', padding: 20}}>
                <Typography variant="display1" align='left' style={{paddingTop: 20}}>
                    Risk Factors
                </Typography>
                <TextField
                    id="dataInput"
                    select
                    helperText="data Input "
                    className={classes.textField}
                    value={this.state.dataInput}
                    onChange={this.handleChange("dataInput")}
                    >
                    {dataInput.map(option => (
                        <MenuItem key={option.value} value={option.value}> 
                        {option.value}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    id="dataInput"
                    select
                    helperText="data Input"
                    className={classes.textField}
                    value={this.state.dataInput1}
                    onChange={this.handleChange("dataInput1")}
                    >
                    {dataInput.map(option => (
                        <MenuItem key={option.value} value={option.value}> 
                        {option.value}
                        </MenuItem>
                    ))}
                </TextField>
              </div>
              <div style={{ width: '100%', justifyContent: 'center', padding: 20}}>
                <Typography variant="display1" align='left' style={{paddingTop: 20}}>
                    Machinery Preferences
                </Typography>
                <TextField
                    id="dataInput"
                    select
                    helperText="data Input"
                    className={classes.textField}
                    value={this.state.dataInput2}
                    onChange={this.handleChange("dataInput2")}
                    >
                    {dataInput.map(option => (
                        <MenuItem key={option.value} value={option.value}> 
                        {option.value}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    id="dataInput"
                    select
                    helperText="data Input"
                    className={classes.textField}
                    value={this.state.dataInput3}
                    onChange={this.handleChange("dataInput3")}
                    >
                    {dataInput.map(option => (
                        <MenuItem key={option.value} value={option.value}> 
                        {option.value}
                        </MenuItem>
                    ))}
                </TextField>
              </div>
              </Card>
              </div>             
          )
      }
} 

export default withStyles(styles)(DrillingCard);


{/* <TextField
                    id="fieldSize"
                    label="Field Size"
                    className={classes.textField}
                    value={this.state.fieldSize}
                    onChange={this.handleChange("fieldSize")}
                    margin="normal" />
                <TextField
                    id="weight"
                    label="Enter weight"
                    className={classes.textField}
                    value={this.state.weight}
                    onChange={this.handleChange("weight")}
                    margin="normal" />
                <TextField
                    id="prevYield"
                    select
                    label="Prev Yield"
                    className={classes.textField}
                    value='2'
                    onChange={this.handleChange("prevYield")}
                    margin="normal"
                    SelectProps={{
                        MenuProps: {
                          className: classes.menu,
                        },
                      }}
                    helperText='Please select one'>
                    {yeilds.map(option => {
                        <MenuItem key={option.value} value={option.value}> 
                            {option.value}
                            </MenuItem>
                    })}
                    </TextField>
                <TextField
                    id="plantDist"
                    label="Planting Distance"
                    className={classes.textField}
                    value={this.state.plantDist}
                    onChange={this.handleChange("plantDist")}
                    margin="normal" />
                <TextField
                    id="cropManage"
                    label="Crop Management"
                    className={classes.textField}
                    value={this.state.crpMng}
                    onChange={this.handleChange("crpMng")}
                    margin="normal" /> */}

import React, { Component } from 'react';
import { Card, Paper, TextField, Typography, withStyles, CardContent, MenuItem, Divider, Button, List, ListItem, ListItemText, ListSubheader } from '@material-ui/core';


const styles = theme => ({
  card: {
    width: 700, 
    align: 'left',
    height: 'auto',
    paddingTop: 25,
    justifyContent: 'left'
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  title: {
    marginBottom: 16,
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: 200,
    paddingBottom: 20,
    display: 'inline-block'
  },
  menu: {
    width: 200,
  },
  button: {
    margin: theme.spacing.unit, 
  },
  input: {
    display: 'none',
  },
  result: { 
      display: 'inline-block',
  },
});


const commodities = [
    { 
        value: 'Wine',
        label: 'Wine',
    }, 
    { 
        value: 'tableGrape',
        label: 'Table grape'
    },
    { 
        value: 'Apples',
        label: 'Apples'
    },
    { 
        value: 'Tomato',
        label: 'Tomato'
    },
    { 
        value: 'Carrot',
        label: 'Carrot'
    },
    { 
        value: 'Potato',
        label: 'Potato'
    }
];

const products = [
    { 
        value: 'Ampexio',
        label: 'Ampexio',
        appliesTo: [ 'Wine', 'Table grape'] 
    },
    { 
        value: 'Ridomil Gold',
        label: 'Ridomil Gold',
        appliesTo: [ 'Wine', 'Table grape', 'Tomato' ]
    },
    {
        value: 'Score',
        label: 'Score',
        appliesTo: ['Wine', 'Table grape', 'Apples', ' Tomato', 'Carrot']
    },
    {
        value: 'Karate Zeon',
        label: 'Karate Zeon',
        appliesTo: ['Wine', 'Table grape', 'Apples', ' Tomato']
    },
    { 
        value: 'Actara',
        label: 'Actara',
        appliesTo: ['Wine', 'Table grape', 'Apples', ' Tomato']
    },
    {
        value: 'Amistar',
        label: 'Amistar',
        appliesTo: ['Wine', 'Table grape', ' Tomato', 'Carrot']
    }
];



const exportDestinations = [
    {
        value: 'France',
        label: 'FRA',
        maxMRL: { 
            Ampexio : {
                wine : 3,
                tableGrape: 1 
            },
        },
    },
    {
        value: 'Australia',
        label: 'AUS',
        maxMRL: { 
            Ampexio : {
                wine : 1,
                tableGrape: 0.3 
            },

        },
    },
    { 
        value: 'UK',
        label: 'UK',
        maxMRL: { 
            Ampexio : {
                wine : 0.5,
                tableGrape: 0.5 
            },

        },
    },
];

const PHInum = [ 0,3,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100,105,110, 115 ]

const tableGrapeResi = [ 2,1,0.5,0.3,0.1,0.09,0.08,0.07,0.06,0.05,0.04,0.03,0.02,0.01,0.009,0.008,0.007,0.006,0.005,0.004,0.003,0.002,0.001,0.001,0.001 ]



class PlainCard extends Component {
    state = {
        suitableProducts: [],
        sprayDate: '2018-07-10',
        harvestDate: '2018-07-10'
    };

    handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  };

  handleChangeCom = name => event => {
    var suitableProducts = []
    products.map(option => {
        console.log(event.target.value)
        if (option.appliesTo.includes(event.target.value)){
            suitableProducts.push(option)
        } 
    })
        this.setState({
        [name]: event.target.value,
        suitableProducts: suitableProducts
        });
        console.log(this.state)
    };

    // a and b are javascript Date objects
    dateDiffInDays(a, b) {
        var _MS_PER_DAY = 1000 * 60 * 60 * 24;
        a = new Date (a)
        b = new Date (b)
        // Discard the time and time-zone information.
        var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
        var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
        const days = (Math.floor((utc2 - utc1) / _MS_PER_DAY));
        const phi = PHInum.indexOf(days)
        console.log('You waited: ' + days + ' days')
        this.setState({
            residue: tableGrapeResi[phi]
        })
        return('Residue: ' + tableGrapeResi[phi])
    }

    

    render() { 
        const { classes } = this.props;

        return (
            <div style={{ width: '50%'}}>
                <Card className={classes.card}>
                    <CardContent>
                        <Typography variant='title' style={{ textAlign: 'center' }}>
                            Crop Calculator
                        </Typography> 
                        <br/> 
                        <Divider/>
                        
                        
                        <div style={{ display: 'inline-block', paddingTop: 20, width: '50%'}}>
                            <TextField
                                id='commodity'
                                select
                                helperText='Commodity'
                                className={classes.TextField}
                                value={this.state.commodity}
                                onChange={this.handleChangeCom('commodity')}
                            >
                            {commodities.map(option => (
                                <MenuItem key={option.value} value={option.label}>
                                    {option.label}
                                </MenuItem>
                            ))}
                            </TextField>
                            <br/>
                            <br/>
                            <TextField
                                id='product'
                                select
                                helperText='Product'
                                className={classes.TextField}
                                value={this.state.product}
                                onChange={this.handleChange('product')}
                            >
                            {this.state.suitableProducts.map(option =>  (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>                    
                            ))}
                            </TextField>
                            
                            <br/>
                            <br/> 
                            <TextField
                                id="sprayDate"
                                label="Last Application Date"
                                type="date"
                                value={this.state.sprayDate}
                                defaultValue="2018-07-10"
                                onChange={this.handleChange('sprayDate')}
                                className={classes.textField}
                                InputLabelProps={{
                                shrink: true,
                                }}
                            />
                            
                            <br/>
                            <br/>
                            <TextField
                                id="harvestDate"
                                label="Harvest Date"
                                type="date"
                                value={this.state.harvestDate}
                                defaultValue="2018-07-10"
                                onChange={this.handleChange('harvestDate')}
                                className={classes.textField}
                                InputLabelProps={{
                                shrink: true,
                                }}
                            />
                            <br/>
                            <Button variant='outlined' className={classes.button} onClick={() => console.log(this.dateDiffInDays(this.state.sprayDate, this.state.harvestDate))}>
                                Calculate 
                            </Button>
                        </div>
                        <div style={{display: 'inline-block', verticalAlign: 'top', paddingTop: '2.5%' }}>

                            
                            
                                <Typography variant='title' >
                                    { this.state.residue ? 'Residue level: ' + this.state.residue : '' }
                                </Typography>
                            
                            
                            <List
                                component="nav" 
                                
                                subheader={<ListSubheader component='div'>You may export to the following countries</ListSubheader>}>
                                {exportDestinations.map(country => { 
                                    console.log(country)
                                    const product = this.state.product;
                                    const comm = commodities.map(com => {
                                        if (com.label == this.state.commodity) {
                                            return com.value
                                        } else {
                                            return;
                                        }
                                    })
                                    console.log(product)
                                    console.log(comm[1])
                                    console.log(country)
                                    if (comm[1] && product && this.state.residue) { 
                                        console.log(country.maxMRL[product])
                                        console.log(country.maxMRL[product][comm[1]])
                                        console.log(this.state.residue)
                                        if ((country.maxMRL[product][comm[1]]) > this.state.residue) {
                                            
                                            return (
                                            <ListItem button>
                                                <ListItemText primary={country.value + "'s MRL = " + (country.maxMRL[product][comm[1]])} />
                                            </ListItem>
                                            ) 
                                            
                                            
                                        } else {
                                            return (
                                                <ListItem disabled>
                                                
                                                <ListItemText primary={'Residue level too high for ' + country.value } />
                                                
                                                </ListItem>
                                                ) 
                                        }
                                    }
                                })}
                            </List>
                        </div>
                        
                        
                    </CardContent>
                    
                </Card>
            </div>
        )
    }
}

export default withStyles(styles)(PlainCard)
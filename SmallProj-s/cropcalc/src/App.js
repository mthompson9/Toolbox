import React, { Component } from 'react';
import logo from './logo.svg';
import PlainCard from './Components/CardExample/plainCard'; 

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Crop Residue Calculator</h1>
        </header>
        <PlainCard/> 
      </div>
    );
  }
}

export default App;

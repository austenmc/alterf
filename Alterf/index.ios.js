/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Navigator
} from 'react-native';

var Camera = require('./app/Camera');

class Alterf extends Component {
  render() {
      return (
          <Navigator
            initialRoute={{uri: 'alterf://app/camera', index: 0}}
            renderScene={function f(route, navigator) {
                switch (route.uri) {
                    case 'alterf://app/camera':
                        return <Camera/>;
                }
            }}
            />
        );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('Alterf', () => Alterf);

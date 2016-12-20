'use strict';
import React, { Component } from 'react';
import {
    NativeModules,
    Navigator,
    StyleSheet,
    Text,
    TouchableHighlight,
    View,
} from 'react-native';

var ALTCameraControl = NativeModules.ALTCameraControl;

var Camera = React.createClass({
    onCamera: function() {
        ALTCameraControl.startSession();
        ALTCameraControl.captureImage();
        ALTCameraControl.endSession();
    },

    render: function() {
        return (
            <View style={styles.container}>
                <TouchableHighlight onPress={this.onCamera} style={styles.buttonContainer}>
                    <View style={styles.buttonContent}>
                        <Text style={styles.buttonContainerText}>
                            Capture 📸
                        </Text>
                    </View>
                </TouchableHighlight>
            </View>
        );
    }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  buttonContent: {
    flexDirection: 'row',
  },
  buttonContainer: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
  },
  buttonContainerText: {
    color: 'black',
  },
});

/*
 *
 API:

 focusMode:
 default
 AVCaptureFocusModeLocked
 AVCaptureFocusModeAutoFocus
 AVCaptureFocusModeContinuousAutoFocus

 focusPointOfInterest: x,y

 exposureMode:
 default
 AVCaptureExposureModeContinuousAutoExposure
 AVCaptureExposureModeLocked

 exposurePointOfInterest: x,y

 videoStabalizationEnabled

 whiteBalanceMode:
 AVCaptureWhiteBalanceModeLocked
 AVCaptureWhiteBalanceModeContinuousAutoWhiteBalance
 ---
Auto Exposure: on/off
on: box displays current value
off: box w/ slider

iso: slider

focusMode: auto, manual
auto: (no point of interest setting yet)
manual: slider

white balance mode: auto, manual
auto: display current value
manual: enable a number field
*/

module.exports = Camera;

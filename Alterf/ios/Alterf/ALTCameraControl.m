
#import "ALTCameraControl.h"

@import AVFoundation;
@import Photos;

#import <AVFoundation/AVCaptureOutput.h>

@implementation ALTCameraControl {
  AVCaptureSession *_session;
}

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(startImageSession)
{
  _session = [[AVCaptureSession alloc] init];

  [_session beginConfiguration];

  _session.sessionPreset = AVCaptureSessionPresetPhoto;

  AVCapturePhotoOutput *photoOutput = [[AVCapturePhotoOutput alloc] init];
  if ( [self.session canAddOutput:photoOutput] ) {
    [self.session addOutput:photoOutput];
    self.photoOutput = photoOutput;

    self.photoOutput.highResolutionCaptureEnabled = YES;
    self.photoOutput.livePhotoCaptureEnabled = self.photoOutput.livePhotoCaptureSupported;
    self.livePhotoMode = self.photoOutput.livePhotoCaptureSupported ? AVCamLivePhotoModeOn : AVCamLivePhotoModeOff;

    self.inProgressPhotoCaptureDelegates = [NSMutableDictionary dictionary];
    self.inProgressLivePhotoCapturesCount = 0;
  }
  else {
    NSLog( @"Could not add photo output to the session" );
    self.setupResult = AVCamSetupResultSessionConfigurationFailed;
    [self.session commitConfiguration];
    return;
  }

  [_session commitConfiguration];
  [_session startRunning];
}

RCT_EXPORT_METHOD(endSession)
{
  [_session stopRunning];
}

RCT_EXPORT_METHOD(captureImage)
{

}

@end
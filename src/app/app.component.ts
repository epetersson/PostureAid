import { AfterViewInit, Component, ElementRef } from '@angular/core';
import * as tmPose from '@teachablemachine/pose';
declare var $:any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'PostureAid';
  model: tmPose.CustomPoseNet;
  webcam: any;
  ctx: any;
  labelContainer: any;
  maxPredictions: any;
  started = false;
  badPosture = false;
  url = 'https://teachablemachine.withgoogle.com/models/-YH3IGnmy/';

  constructor(private elementRef: ElementRef){}

  ngAfterViewInit(){
    this.elementRef.nativeElement.ownerDocument.body.style.backgroundColor = '#add8e6';
 }

  async init() {
    this.started = true;
    const modelURL = this.url + 'model.json';
    const metadataURL = this.url + 'metadata.json';

    // load the model and metadata
    // Refer to tmPose.loadFromFiles() in the API to support files from a file picker
    this.model = await tmPose.load(modelURL, metadataURL);
    this.maxPredictions = this.model.getTotalClasses();

    // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    this.webcam = new tmPose.Webcam(400, 400, flip); // width, height, flip
    await this.webcam.setup(); // request access to the webcam
    this.webcam.play();
    requestAnimationFrame(() =>
      this.loop()
   );

    // append/get elements to the DOM
    var canvas = <HTMLCanvasElement>document.getElementById('canvas');
    canvas.width = 400; canvas.height = 400;
    this.ctx = canvas.getContext('2d');
    this.labelContainer = document.getElementById('label-container');
    for (let i = 0; i < this.maxPredictions; i++) { // and class labels
      this.labelContainer.appendChild(document.createElement('div'));
    }
  }

  async loop() {
    this.webcam.update(); // update the webcam frame
    await this.predict();
    requestAnimationFrame(() =>
    this.loop()
 );
  }

  async predict() {
    // Prediction #1: run input through posenet
    // estimatePose can take in an image, video or canvas html element
    const { pose, posenetOutput } = await this.model.estimatePose(this.webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await this.model.predict(posenetOutput);

    for (let i = 0; i < this.maxPredictions; i++) {
      const classPrediction =
        prediction[i].className + ': ' + prediction[i].probability.toFixed(2);
      this.labelContainer.childNodes[i].innerHTML = classPrediction;
    }

    if (prediction[1].probability > prediction[0].probability) {
        $('.toast').toast('show');
    } else if (prediction[1].probability < prediction[0].probability) {
      $('.toast').toast('hide');
    }
    // finally draw the poses
    this.drawPose(pose);
  }

  async drawPose(pose) {
    this.ctx.drawImage(this.webcam.canvas, 0, 0);
    // draw the keypoints and skeleton
    if (pose) {
      const minPartConfidence = 0.5;
      tmPose.drawKeypoints(pose.keypoints, minPartConfidence, this.ctx);
      tmPose.drawSkeleton(pose.keypoints, minPartConfidence, this.ctx);
    }
  }
}


import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewChild,
  WritableSignal,
  signal,
} from '@angular/core';

@Component({
  selector: 'dl-web-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './web-page.component.html',
  styleUrl: './web-page.component.scss',
})
export class WebPageComponent {
  @ViewChild('video1', { static: true }) video1!: ElementRef;
  videoSource!: string;

  public buttonOneHover: WritableSignal<boolean> = signal(false);

  constructor(private elRef: ElementRef) {
    this.setVideoSource();
  }

  // ngOnInit(): void {
  //   this.elRef.nativeElement.ownerDocument.body.classList.remove('dark');
  // }

  ngAfterViewInit(): void {
    const media = this.video1.nativeElement;
    media.muted = true;
    media.play();
  }

  getDoughlyClick() {
    console.log('Doughly clicked');
  }

  mouseOver(button: string) {
    if (button === 'buttonOne') {
      this.buttonOneHover.set(true);
    }
  }

  mouseLeave(button: string) {
    if (button === 'buttonOne') {
      this.buttonOneHover.set(false);
    }
  }

  private setVideoSource(): void {
    this.elRef.nativeElement.ownerDocument.body.classList.remove('dark');
    if (
      this.elRef.nativeElement.ownerDocument.body.classList.contains('dark')
    ) {
      this.videoSource = 'assets/videos/createURLRecipeFramed-dark.mp4';
    } else {
      this.videoSource = 'assets/videos/createURLRecipeFramed-light.mp4';
    }
  }
}

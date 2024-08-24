import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  ElementRef,
  ViewChild,
  WritableSignal,
  signal,
} from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'dl-web-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './web-page.component.html',
  styleUrl: './web-page.component.scss',
})
export class WebPageComponent {
  private API_URL = `${environment.BACKEND}/web`;
  @ViewChild('video1', { static: true }) video1!: ElementRef;
  videoSource!: string;

  public buttonOneHover: WritableSignal<boolean> = signal(false);

  constructor(private elRef: ElementRef, private http: HttpClient) {
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

  mouseOver(button: string) {
    if (button === 'buttonOne') {
      this.buttonOneHover.set(true);
    }
  }

  routeToStoreListing() {
    if (Capacitor.isNativePlatform()) {
      if (Capacitor.getPlatform() === 'android') {
        // send to backend, it will reroute to play store
        this.http.get(`${this.API_URL}/play-store`).subscribe();
      } else {
        // send to backend, it will reroute to app store
        this.http.get(`${this.API_URL}/app-store`).subscribe();
      }
    } else {
      // send to backend, it will reroute to app store
      this.http.get(`${this.API_URL}/app-store`).subscribe();
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

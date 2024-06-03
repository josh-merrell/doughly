import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineComponent } from '../social/feature/timeline/timeline.component';
import { FollowersComponent } from '../social/feature/followers/followers.component';
import { FriendsComponent } from '../social/feature/friends/friends.component';
import { ExtraStuffService } from '../shared/utils/extraStuffService';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FriendsComponent,
    FollowersComponent,
    TimelineComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  constructor(public extraStuffService: ExtraStuffService) {}
}

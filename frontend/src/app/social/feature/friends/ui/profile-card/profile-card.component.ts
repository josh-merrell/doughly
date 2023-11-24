import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile } from 'src/app/profile/state/profile-state';

@Component({
  selector: 'dl-profile-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-card.component.html',
})
export class ProfileCardComponent {
  @Input() profile!: Profile;
}

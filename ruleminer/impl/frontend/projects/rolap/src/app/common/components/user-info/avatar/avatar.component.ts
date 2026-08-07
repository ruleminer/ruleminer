import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
})
export class AvatarComponent implements OnInit {
  @Input() avatarDiameter: number;
  @Input() userName = '';

  public avatarLetters = '';
  public color = '';

  constructor() {}

  ngOnInit(): void {
    this.createAvatarLetters();
    this.color = this.getBackgroundColor(this.userName);
  }

  private createAvatarLetters() {
    const firstLetters: string[] = this.userName
      .split(/\s/)
      .map((x) => x.toUpperCase().slice(0, 1))
      .slice(0, 2);

    if (firstLetters.length === 1) {
      this.avatarLetters = firstLetters[0];
    } else if (firstLetters.length === 2) {
      this.avatarLetters = `${firstLetters[0]}${firstLetters[1]}`;
    }
  }

  private getBackgroundColor(stringInput: string): string {
    const stringUniqueHash = [...stringInput].reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return `hsl(${stringUniqueHash % 360}, 60%, 85%)`;
  }
}

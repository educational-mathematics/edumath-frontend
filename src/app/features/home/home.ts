import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Topics } from '../../core/topics';
import { Navbar } from '../../shared/components/navbar/navbar';
import { AddTopicDialog } from '../topics/add-topic-dialog/add-topic-dialog';

@Component({
  selector: 'app-home',
  imports: [Navbar, CommonModule, AddTopicDialog],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  private topics = inject(Topics);
  private router = inject(Router);

  loaded = false;

  alreadyAddedIds: number[] = [];

  showAdd = false;
  items: any[] = [];

  ngOnInit() { this.load(); }
  load() {
    this.loaded = false;
    this.topics.myTopics().subscribe({
      next: list => {
        this.items = list || [];
        this.alreadyAddedIds = this.items.map(x => x.topicId);
        this.loaded = true;
      },
      error: _ => { this.items = []; this.alreadyAddedIds = []; this.loaded = true; }
    });
  }

  onOpenAdd() { this.showAdd = true; }
  onPickTopic(t: any) {
    this.showAdd = false;
    this.topics.addTopic(t.id).subscribe({
      next: _ => { this.showAdd = false; this.load(); },
      error: _ => { this.showAdd = false; }
    });
  }
  onCancelAdd() { this.showAdd = false; }

  enter(t: any) {
    if (!t?.userTopicId) return;
    this.router.navigate(['/topic', t.slug]);
  }
}
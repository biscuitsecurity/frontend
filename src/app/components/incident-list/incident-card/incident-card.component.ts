import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatExpansionPanel } from '@angular/material/expansion';
import { Incident } from 'app/model/incident';
import { IncidentComment } from 'app/model/incident-comment';
import { ContractComment, ContractIncident, ContractService } from 'app/services/contract.service';
import { Users } from 'app/model/users';
import { UsersService } from 'app/services/users.service';

@Component({
  selector: 'app-incident-card',
  templateUrl: './incident-card.component.html',
  styleUrls: ['./incident-card.component.css']
})
export class IncidentCardComponent implements OnInit {
  @Input() contractIncident: ContractIncident;
  @ViewChild('commentsPanel') commentsPanel: MatExpansionPanel;

  votes = 0;
  numberComments = 0;

  incident: Incident;
  comments: IncidentComment[] = [];
  commentsLoading = false;
  postingLoading = false;
  impact: string;
  usernames = Users.usernames;
  date: Date;

  newComment: string = "";

  constructor(private contractService: ContractService, private usersService: UsersService) { }

  ngOnInit(): void {
    console.log(this.contractIncident);
    this.date = new Date(this.contractIncident.created * 1000);
    this.numberComments = this.contractIncident.comments.length;
    this.loadIncidentData();
  }

  async loadIncidentData() {
    this.incident = JSON.parse(await this.contractService.getIpfsContent(this.contractIncident.content));
    console.log(this.incident);
    this.impact = (this.incident.impacts[0] as any).impact[0];
  }

  async loadComments() {
    console.log('loading Comments')
    console.log(this.comments);
    if (this.comments.length === this.contractIncident.comments.length || this.comments.length != 0) {
      return;
    } 

    this.comments = [];
    this.commentsLoading = true;
    const promises: Promise<any>[] = [];
    for (const comment of this.contractIncident.comments) {
      promises.push((async () => {
        const result = await this.contractService.getIpfsContent(comment.content);
        this.comments.push({
          author: this.contractIncident.author,
          content: result,
          created: new Date(this.contractIncident.created * 1000),
          votes: this.calculateVotes(this.contractIncident.votes)
        });
      })());
    }
    await Promise.all(promises);
    console.log(this.comments);
    this.commentsLoading = false;
  }

  public vote(vote: number): void {
    this.votes += vote;
  }

  public async toggleComments() {
    console.log('toggle comments')
    if (this.commentsPanel.expanded) {
      this.commentsPanel.close();
    } else {
      await this.loadComments();
      this.commentsPanel.open();
    }
  }

  public async postComment(){
    console.log("Posting comment: " + this.newComment);
    this.postingLoading = true;
    await this.contractService.postComment(this.contractIncident.ref, this.contractIncident.ref, {author: 'Petra', text: this.newComment});
    this.comments.push({
      author: this.usersService.role,
      created: new Date(),
      votes: 0,
      content: this.newComment
    });
    this.numberComments++;
    this.newComment = '';
    this.postingLoading = false;
  }

  private calculateVotes(votes: []): number{
    let voteNumber = 0;
    votes.forEach(vote => {
      voteNumber += vote[1];
    });
    return voteNumber;
  }
}

import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IncidentService } from 'app/services/incident.service';
import { Incident, IncidentElement } from 'app/model/incident';
import { EventConstraintPipe } from './event-constraint.pipe';

@Component({
  selector: 'app-tree-selector',
  templateUrl: './tree-selector.component.html',
  styleUrls: ['./tree-selector.component.css'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: TreeSelectorComponent,
    multi: true
  }]
})
export class TreeSelectorComponent implements OnInit, OnChanges, ControlValueAccessor {
  @Input() incidentTree: IncidentTree;
  @Input() triggeredBy: string;
  @Input() sort: boolean;
  @Input() numberOfSubElementsShown: boolean;
  @Output() valueChange = new EventEmitter();

  incident: Incident;
  choices: any = [];
  selections: IncidentElement = new IncidentElement();

  constructor(private incidentService: IncidentService) {
    this.selections.elements = [];
   }

  ngOnInit() {
    this.incident = this.incidentService.getIncident();
    this.choices[0] = this.incidentTree.elements;
    if(this.choices[0]){
      this.sortSubElements(this.choices[0]);
      this.choices[0].forEach(element => {
        this.addTooltip(element);
      });
    }
  }

  selectionChange(value: any, i: number) {
    console.log(value);
    console.log(this.choices);
    for (let j = this.selections.elements.length - 1; j > i; j--) {
      this.choices.pop();
      this.selections.elements.pop();
    }

    if (value === undefined) {
      this.selections.elements.pop();
      this.choices.pop();
      if (this.choices.length === 0) {
        this.choices[0] = this.incidentTree[Object.keys(this.incidentTree)[0]];
      }
    } else {
      this.selections.elements[i] = value.name;
      this.selections.elementId = value.id;
    }
    if (value.elements) {
      this.choices[i + 1] = value.elements;
      if(this.choices[i + 1]){
        this.choices[i + 1].forEach(element => {
          this.addTooltip(element);
        });
      }
      this.sortSubElements(this.choices[i + 1]);
    }

    this.valueChange.emit(this.selections);
  }

  registerOnTouched(): void {
  }

  registerOnChange(fn: any): void {
    this.valueChange.subscribe((data: IncidentElement) => fn(data));
  }

  writeValue(value: IncidentElement): void {
    this.selections = value;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.triggeredBy) {
      const eventConstraintPipe: EventConstraintPipe = new EventConstraintPipe();
      this.selections.elements.forEach((selection, i) => {
        if (!eventConstraintPipe.isEventAllowed(
            selection,
            this.incident.getElementById(changes.triggeredBy.currentValue).elements)) {
          this.selectionChange(undefined, i);
        }
      });
    }
  }

  addTooltip(element: any){
    console.log(element);
    if(!element.tooltip){
      element.tooltip = '';
      this.sortSubElements(element.elements);
      if(element.elements){
        element.elements.forEach(childElement => {
          element.tooltip += childElement.name + '\r\n';
        });
      }
    }
  }

  sortSubElements(element: any[]){
    if(!this.sort){
      return;
    }
    console.log(element)
    if(element){
      element.sort((a, b) =>{
        return a.name > b.name ? 1: -1;
      })
    }
  }
}


export class IncidentTree {
  name: string;
  elements?: IncidentTree[];
  id?: string;
  tooltip?: string;
}

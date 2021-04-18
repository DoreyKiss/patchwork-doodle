import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoomComponent } from './room/room.component';

@NgModule({
    declarations: [
        RoomComponent
    ],
    imports: [
        CommonModule,
        FormsModule
    ]
})
export class PatchworkDoodleModule { }

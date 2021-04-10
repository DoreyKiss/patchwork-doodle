import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RoomComponent as PatchworkDoodleRoomComponent } from './games/patchwork-doodle/room/room.component';

const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'patchwork_doodle/:id', component: PatchworkDoodleRoomComponent }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }

import { Global, Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebaseAuthService } from './firebase-auth.service';

@Global()
@Module({
  providers: [FirebaseService, FirebaseAuthService],
  exports: [FirebaseService, FirebaseAuthService],
})
export class FirebaseModule {}

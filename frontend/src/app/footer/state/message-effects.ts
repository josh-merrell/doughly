import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { MessageService } from '../data/message.service';
import { catchError, map, mergeMap, of } from 'rxjs';
import { MessageActions } from './message-actions';

@Injectable()
export class MessageEffects {
  constructor(
    private actions$: Actions,
    private messageService: MessageService
  ) {}

  loadMessages$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MessageActions.loadMessages),
      mergeMap(() =>
        this.messageService.getAll().pipe(
          map((messages) =>
            MessageActions.loadMessagesSuccess({ messages })
          ),
          catchError((error) =>
            of(
              MessageActions.loadMessagesFailure({
                error: {
                  message: error.error.error,
                  statusCode: error.status,
                  rawError: error,
                },
              })
            )
          )
        )
      )
    );
  });

  acknowledgeMessage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MessageActions.acknowledgeMessage),
      mergeMap((action) =>
        this.messageService.acknowledge(action.message).pipe(
          map(() => MessageActions.acknowledgeMessageSuccess()),
          catchError((error) =>
            of(
              MessageActions.acknowledgeMessageFailure({
                error: {
                  message: error.error.error,
                  statusCode: error.status,
                  rawError: error,
                },
              })
            )
          )
        )
      )
    );
  });

  //load messages after acknowledgSuccess
  loadMessagesAfterAcknowledge$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MessageActions.acknowledgeMessageSuccess),
      map(() => MessageActions.loadMessages())
    );
  });

  deleteMessage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MessageActions.deleteMessage),
      mergeMap((action) =>
        this.messageService.delete(action.message).pipe(
          map(() => MessageActions.deleteMessageSuccess()),
          catchError((error) =>
            of(
              MessageActions.deleteMessageFailure({
                error: {
                  message: error.error.error,
                  statusCode: error.status,
                  rawError: error,
                },
              })
            )
          )
        )
      )
    );
  });

  //load messages after deleteSuccess
  loadMessagesAfterDelete$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MessageActions.deleteMessageSuccess),
      map(() => MessageActions.loadMessages())
    );
  });
}

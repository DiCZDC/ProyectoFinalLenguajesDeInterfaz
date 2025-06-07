.model small
;Macro que ejecuta un pitido con una frecuencia dada
pitido MACRO freq, time
    LOCAL espera
    PUSH DX
    PUSH CX
    PUSH BX
    PUSH AX

    ; Hace un beep usando el altavoz del PC
    mov AL, 182         ; Comando para el canal 2 del PIT (modo cuadrado)
    out 43h, AL

    mov ax, freq        ; Frecuencia para ~1000 Hz (1193180 / 1000)
    out 42h, AL         ; Enviar byte bajo
    mov al, ah
    out 42h, AL         ; Enviar byte alto

    in  al, 61h         ; Leer el puerto del altavoz
    or  al, 3           ; Encender el altavoz y el canal 2
    out 61h, al

    ;mov cx, 0FFFFh      ; Espera simple (ajusta para duración)
    ;espera:
    ;loop espera
    wait_seconds time
    
    in  al, 61h
    and al, 0FC         ; Apagar el altavoz
    out 61h, al

    POP AX
    POP BX
    POP CX
    POP DX
ENDM
; Espera 'segundos' segundos usando el reloj del BIOS
wait_seconds MACRO segundos
    LOCAL wait_loop

    PUSH AX
    PUSH BX
    PUSH CX
    PUSH DX

    mov ah, 00h         ; Leer contador de ticks
    int 1Ah
    mov bx, dx          ; Guardar valor inicial

    mov cx, segundos
    mov ax, 18         ; 18.2 ticks por segundo (aprox)
    mul cx              ; AX = segundos * 18.2
    add bx, ax          ; BX = tick final esperado

wait_loop:
    mov ah, 00h
    int 1Ah
    cmp dx, bx
    jb wait_loop        ; Esperar hasta alcanzar el tick final

    POP DX
    POP CX
    POP BX
    POP AX
ENDM

.stack

.data
    sii dw 2415       ;nada si oktaf 1  (7)
    la  dw 2711       ;nada la oktaf 1  (6)
    sol dw 3043       ;nada sol oktaf 1 (5)
    fa  dw 3416       ;nada fa oktaf 1 (4)
    mi  dw 3619       ;nada mi oktaf 1 (3)
    re  dw 4061       ;2
    do  dw 4560       ;1 

.code
    MAIN Proc Far
        MOV    AX, @data
        MOV    DS, AX
        
        inicio:
        
        pitido sol, 1
        pitido la, 1
        pitido sii, 1

        pitido sol, 1

        pitido sol, 1
        pitido la, 1
        pitido sii, 1
        pitido sol, 1

        pitido sii, 1
        pitido do, 1
        pitido re, 1
        JMP inicio
        fin:
        .exit
MAIN ENDP


END MAIN

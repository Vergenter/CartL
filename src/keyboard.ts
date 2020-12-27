import { IO } from "fp-ts/lib/IO";

export interface ButtonsState{down:boolean,left:boolean,up:boolean,right:boolean,space:boolean}

export const setButtonState : IO<ButtonsState> = () => {
        const buttons = {
            down:false,
            left:false,
            up:false,
            right:false,
            space:false
        };
        const onKey = (state:boolean)=> (key:{keyCode:number,preventDefault:()=>void}) => {
            // W Key is 87
            // Up arrow is 87
            if (key.keyCode === 87 || key.keyCode === 38) {
                key.preventDefault()
                // If the W key or the Up arrow is pressed, move the player up.
                buttons.up=state;
            }
    
            // S Key is 83
            // Down arrow is 40
            if (key.keyCode === 83 || key.keyCode === 40) {
                key.preventDefault()
                // If the S key or the Down arrow is pressed, move the player down.
                buttons.down=state;
            }
    
            // A Key is 65
            // Left arrow is 37
            if (key.keyCode === 65 || key.keyCode === 37) {
                key.preventDefault()
                // If the A key or the Left arrow is pressed, move the player to the left.
                buttons.left=state;
            }
    
            // D Key is 68
            // Right arrow is 39
            if (key.keyCode === 68 || key.keyCode === 39) {
                key.preventDefault()
                // If the D key or the Right arrow is pressed, move the player to the right.
                buttons.right=state;
            }
            if (key.keyCode === 32) {
                key.preventDefault()
                // If the D key or the Right arrow is pressed, move the player to the right.
                buttons.space=state;
            }
        }
        document.addEventListener('keydown', onKey(true));
        document.addEventListener('keyup', onKey(false));
        return buttons;

}
import { VideoInfo } from "../../../types";

interface DialogData {
    videoInfo?: VideoInfo;
}

const dialogData: DialogData = {};

export function getDialogData(): DialogData {
    return dialogData;
}

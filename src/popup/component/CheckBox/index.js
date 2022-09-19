import { useCallback, useEffect, useState } from "react";


export const CheckBox = ({
    onClick = () => { },
    status = false
}) => {


    const getBoxImage = useCallback(() => {
        if (status) {
            return "/img/icon_checked.svg"
        } else {
            return "/img/icon_unchecked.svg"
        }
    }, [status])

    const [imgSrc, setImgSrc] = useState(() => {
        return getBoxImage()
    })

   


    useEffect(() => {
        setImgSrc(getBoxImage())
    }, [status])

    return (<div onClick={onClick}>
        <img src={imgSrc} />
    </div>)
} 
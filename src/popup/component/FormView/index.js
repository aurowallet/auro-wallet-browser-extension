import { useCallback } from "react";
import styles from "./index.module.scss";

const FormView = ({ 
    children,
}) => { 
    const onSubmit = useCallback((event)=>{
        event.preventDefault();
    },[])
    return (
        <form className={styles.container} onSubmit={onSubmit}>
            {children}
        </form>
    )
}

export default FormView
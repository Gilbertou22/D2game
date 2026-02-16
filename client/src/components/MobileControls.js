function MobileControls({ setInventoryOpen }) {
    return (
        <div style={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 100
        }}>
            <button
                onClick={() => setInventoryOpen(prev => !prev)}
                style={{
                    width: 70,
                    height: 70,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.7)',
                    border: '4px solid #888',
                    color: 'white',
                    fontSize: '36px',
                    cursor: 'pointer'
                }}
            >
                背包
            </button>
        </div>
    );
}

export default MobileControls;